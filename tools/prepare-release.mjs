import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { log } from 'node:console';
import { Buffer } from 'node:buffer';
import { GitHub, Manifest } from 'release-please';
import { Version } from 'release-please/build/src/version.js';

const manifestPath = '.release-please-manifest.json';
const configPath = 'release-please-config.json';
const versionFiles = [manifestPath, 'CHANGELOG.md', 'package.json', 'package-lock.json'];
const stableVersion = /^\d+\.\d+\.\d+$/;
const contentsText = (api, path, ref) =>
  Buffer.from(api(`contents/${path}?ref=${ref}`).content, 'base64').toString();
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};

export const contentsJson = (api, path, ref) => JSON.parse(contentsText(api, path, ref));

// A merged manifest is a preparation result, not proof of publication. Recover only
// the reviewed root-package case; ambiguous or partially published states stop here.
export function recoveryBase(api, sha, config, version) {
  requireThat(
    config['include-component-in-tag'] === false &&
      config['include-v-in-tag'] === true &&
      JSON.stringify(Object.keys(config.packages)) === '["."]',
    'Release-Vorbereitung unterstützt nur ein Root-Paket mit v-Tags.',
  );
  requireThat(stableVersion.test(version), 'Keine eindeutige stabile Manifestversion.');
  const tags = api(`git/matching-refs/tags/v${version}`);
  const releases = api('releases?per_page=100');
  const tagExists = tags.some((tag) => tag.ref === `refs/tags/v${version}`);
  const matching = releases.filter((release) => release.tag_name === `v${version}`);
  if (tagExists || matching.length) {
    requireThat(
      tagExists && matching.length === 1 && !matching[0].draft && !matching[0].prerelease,
      'Manifestversion ist nur teilweise oder uneindeutig veröffentlicht.',
    );
    return undefined;
  }
  const merged = api('pulls?state=closed&base=main&per_page=100').filter(
    (pr) =>
      pr.merged_at &&
      pr.user.login === 'github-actions[bot]' &&
      pr.head.ref.startsWith('release-please--branches--main') &&
      pr.base.ref === 'main' &&
      contentsJson(api, manifestPath, pr.merge_commit_sha)['.'] === version,
  );
  requireThat(
    merged.length === 1,
    'Unveröffentlichte Manifestversion ohne eindeutigen Versions-Merge.',
  );
  const files = api(`pulls/${merged[0].number}/files?per_page=100`);
  requireThat(
    files.length === 4 && files.every((file) => versionFiles.includes(file.filename)),
    'Versions-Merge enthält unerwartete Dateien.',
  );
  requireThat(
    api(`compare/${merged[0].merge_commit_sha}...${sha}`).status === 'ahead',
    'Unveröffentlichter Versions-Merge ist kein älterer Main-Vorfahr.',
  );
  const published = releases
    .filter(
      (release) =>
        !release.draft && !release.prerelease && /^v\d+\.\d+\.\d+$/.test(release.tag_name),
    )
    .sort((a, b) => Version.parse(b.tag_name.slice(1)).compare(Version.parse(a.tag_name.slice(1))));
  const latest = published[0];
  requireThat(
    latest && Version.parse(latest.tag_name.slice(1)).compare(Version.parse(version)) < 0,
    'Keine ältere veröffentlichte Release-Basis gefunden.',
  );
  const baseline = api(`commits/${latest.tag_name}`).sha;
  requireThat(
    /^[0-9a-f]{40}$/.test(baseline) &&
      api(`compare/${baseline}...${sha}`).status === 'ahead' &&
      contentsJson(api, manifestPath, baseline)['.'] === latest.tag_name.slice(1) &&
      contentsJson(api, 'package.json', baseline).version === latest.tag_name.slice(1),
    'Tag, Manifest und Main-Vorfahr der veröffentlichten Basis passen nicht zusammen.',
  );
  const history = contentsText(api, 'CHANGELOG.md', baseline);
  const currentHistory = contentsText(api, 'CHANGELOG.md', sha);
  const historicalEntries = history.slice(history.indexOf('\n## ')).trim();
  const firstHeading = currentHistory.match(/^## .+$/m)?.[0];
  requireThat(
    history.includes('\n## ') &&
      firstHeading?.startsWith(`## [${version}]`) &&
      currentHistory.trim().endsWith(historicalEntries) &&
      currentHistory.slice(0, currentHistory.indexOf(historicalEntries)).match(/^## /gm)?.length ===
        1,
    'Changelog enthält zusätzliche Änderungen außerhalb des unveröffentlichten Abschnitts.',
  );
  const previous = Version.parse(version);
  const next = new Version(previous.major, previous.minor, previous.patch + 1).toString();
  return { sha: baseline, version: next, tag: latest.tag_name };
}

export async function releaseManifest(github, recovery) {
  if (recovery) {
    const read = github.getFileContentsOnBranch.bind(github);
    // Release Please still generates all files. Only its two historical inputs
    // come from the published baseline; package/config/dependencies stay on main.
    github.getFileContentsOnBranch = (path, branch) =>
      read(
        path,
        branch === 'main' && [manifestPath, 'CHANGELOG.md'].includes(path) ? recovery.sha : branch,
      );
  }
  return Manifest.fromManifest(
    github,
    'main',
    configPath,
    manifestPath,
    {},
    undefined,
    recovery?.version,
  );
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  requireThat(
    /^[\w.-]+\/[\w.-]+$/.test(repository ?? '') && /^[0-9a-f]{40}$/.test(sha ?? ''),
    'Repository oder SHA fehlt.',
  );
  const api = (path) =>
    JSON.parse(
      execFileSync('gh', ['api', `repos/${repository}/${path}`], {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      }),
    );
  const config = contentsJson(api, configPath, sha);
  const version = contentsJson(api, manifestPath, sha)['.'];
  const recovery = recoveryBase(api, sha, config, version);
  const [owner, repo] = repository.split('/');
  const github = await GitHub.create({ owner, repo, token: process.env.GH_TOKEN });
  const manifest = await releaseManifest(github, recovery);
  requireThat(
    api('git/ref/heads/main').object.sha === sha,
    'Main hat sich während Prepare geändert.',
  );
  if (process.argv.includes('--dry-run')) {
    const candidates = await manifest.buildPullRequests();
    log(
      JSON.stringify({
        recovery,
        candidates: candidates.map((pr) => ({
          version: pr.version?.toString(),
          body: pr.body.toString(),
        })),
      }),
    );
    return;
  }
  // This API creates/updates PRs only. Tagging and publication remain in the
  // separate workflow job behind full QA and the unchanged identity gates.
  const prs = await manifest.createPullRequests();
  requireThat(prs.length <= 1, 'Mehrere Root-Versions-PRs erzeugt.');
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `pr=${JSON.stringify(prs[0] ?? null)}\n`);
  log(
    recovery
      ? `Versions-PR von ${recovery.tag} für v${recovery.version} neu vorbereitet.`
      : 'Versions-PR regulär vorbereitet.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
