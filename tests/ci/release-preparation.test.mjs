import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import { recoveryBase, releaseManifest } from '../../tools/prepare-release.mjs';

const config = JSON.parse(
  readFileSync(new URL('../../release-please-config.json', import.meta.url)),
);
const current = 'a'.repeat(40);
const merged = 'b'.repeat(40);
const published = 'c'.repeat(40);
const file = (text) => ({
  content: Buffer.from(text).toString('base64'),
  parsedContent: text,
  sha: 'd'.repeat(40),
});
const json = (value) => file(JSON.stringify(value));

function fixture() {
  return new Map([
    ['git/matching-refs/tags/v0.5.0', []],
    ['releases?per_page=100', [{ tag_name: 'v0.4.1', draft: false, prerelease: false }]],
    [
      'pulls?state=closed&base=main&per_page=100',
      [
        {
          number: 287,
          merged_at: '2026-11-13',
          user: { login: 'github-actions[bot]' },
          head: { ref: 'release-please--branches--main--components--pixels-world' },
          base: { ref: 'main' },
          merge_commit_sha: merged,
        },
      ],
    ],
    [`contents/.release-please-manifest.json?ref=${merged}`, json({ '.': '0.5.0' })],
    [
      'pulls/287/files?per_page=100',
      ['.release-please-manifest.json', 'CHANGELOG.md', 'package.json', 'package-lock.json'].map(
        (filename) => ({ filename }),
      ),
    ],
    [`compare/${merged}...${current}`, { status: 'ahead' }],
    ['commits/v0.4.1', { sha: published }],
    [`compare/${published}...${current}`, { status: 'ahead' }],
    [`contents/.release-please-manifest.json?ref=${published}`, json({ '.': '0.4.1' })],
    [`contents/package.json?ref=${published}`, json({ version: '0.4.1' })],
    [
      `contents/CHANGELOG.md?ref=${published}`,
      file('# Changelog\n\n## [0.4.1]\n\nPublished fix\n'),
    ],
    [
      `contents/CHANGELOG.md?ref=${current}`,
      file('# Changelog\n\n## [0.5.0]\n\nUnpublished notes\n\n## [0.4.1]\n\nPublished fix\n'),
    ],
  ]);
}

const apiFor = (data) => (path) => {
  assert.ok(data.has(path), `Unerwarteter API-Aufruf: ${path}`);
  return data.get(path);
};

test('Veröffentlichte Manifestversion verwendet die reguläre Vorbereitung', () => {
  const data = fixture();
  data.set('git/matching-refs/tags/v0.5.0', [{ ref: 'refs/tags/v0.5.0' }]);
  data.set('releases?per_page=100', [{ tag_name: 'v0.5.0', draft: false, prerelease: false }]);
  assert.equal(recoveryBase(apiFor(data), current, config, '0.5.0'), undefined);
});

test('Fehlgeschlagener Versions-Merge ermittelt die veröffentlichte Basis ohne Schreibzugriffe', () => {
  assert.deepEqual(recoveryBase(apiFor(fixture()), current, config, '0.5.0'), {
    sha: published,
    version: '0.5.1',
    tag: 'v0.4.1',
  });
});

test('Teilpublikation, falscher Bot, Dateien und nicht passende Abstammung stoppen Recovery', () => {
  const changes = [
    ['git/matching-refs/tags/v0.5.0', [{ ref: 'refs/tags/v0.5.0' }]],
    ['releases?per_page=100', [{ tag_name: 'v0.5.0', draft: true }]],
    ['pulls?state=closed&base=main&per_page=100', []],
    ['pulls/287/files?per_page=100', [{ filename: 'src/main.ts' }]],
    [`compare/${merged}...${current}`, { status: 'diverged' }],
    [`compare/${published}...${current}`, { status: 'behind' }],
    [`contents/.release-please-manifest.json?ref=${published}`, json({ '.': '0.3.0' })],
    ['releases?per_page=100', []],
    [
      `contents/CHANGELOG.md?ref=${current}`,
      file('# Changelog\n\n## [0.5.0]\n\n## [0.4.1]\n\nChanged published history\n'),
    ],
  ];
  for (const [key, value] of changes) {
    const data = fixture();
    data.set(key, value);
    assert.throws(() => recoveryBase(apiFor(data), current, config, '0.5.0'), undefined, key);
  }
  const data = fixture();
  data.get('pulls?state=closed&base=main&per_page=100')[0].user.login = 'other';
  assert.throws(() => recoveryBase(apiFor(data), current, config, '0.5.0'));
  assert.throws(() =>
    recoveryBase(
      apiFor(fixture()),
      current,
      { ...config, 'include-component-in-tag': true },
      '0.5.0',
    ),
  );
});

function githubFixture() {
  const reads = [];
  const github = {
    repository: { owner: 'example', repo: 'game', defaultBranch: 'main' },
    async getFileContentsOnBranch(path, branch) {
      reads.push({ path, branch });
      if (path === 'release-please-config.json') return json(config);
      if (path === '.release-please-manifest.json')
        return json({ '.': branch === published ? '0.4.1' : '0.5.0' });
      if (path === 'CHANGELOG.md')
        return file(
          branch === published
            ? '# Changelog\n\n## [0.4.1]\n\nPublished fix\n'
            : '# Changelog\n\n## [0.5.0]\n\nUnpublished notes\n\n## [0.4.1]\n\nPublished fix\n',
        );
      if (path === 'package.json')
        return json({
          name: 'pixels-world',
          version: '0.5.0',
          dependencies: { phaser: '3.90.0' },
          devDependencies: { fflate: '0.8.3' },
        });
      if (path === 'package-lock.json')
        return json({
          name: 'pixels-world',
          version: '0.5.0',
          lockfileVersion: 3,
          packages: {
            '': { name: 'pixels-world', version: '0.5.0', devDependencies: { fflate: '0.8.3' } },
          },
        });
      throw new Error(`Unerwartete Datei ${path}`);
    },
    async getFileJson(path, branch) {
      return JSON.parse((await this.getFileContentsOnBranch(path, branch)).parsedContent);
    },
    async *releaseIterator() {
      yield { tagName: 'v0.4.1', sha: published, name: 'v0.4.1', notes: '' };
    },
    async *tagIterator() {
      yield { name: 'v0.4.1', sha: published };
    },
    async *mergeCommitIterator() {
      yield {
        sha: current,
        message: 'fix(test): read emoji ZIPs without system unzip',
        files: ['tests/e2e/emoji-download.spec.ts'],
      };
      yield {
        sha: merged,
        message: 'chore(main): Version 0.5.0 vorbereiten',
        files: ['package.json'],
      };
      yield {
        sha: 'e'.repeat(40),
        message: 'feat(ui): add responsive camera',
        files: ['src/main.ts'],
      };
      yield { sha: published, message: 'fix: published fix', files: ['src/main.ts'] };
      yield { sha: 'f'.repeat(40), message: 'feat: ancient feature', files: ['src/main.ts'] };
    },
  };
  return { github, reads };
}

test('Echter Release-Please-Generator rekonstruiert 0.5.1 ohne alte Historie oder doppelte Abschnitte', async () => {
  const { github, reads } = githubFixture();
  const manifest = await releaseManifest(github, {
    sha: published,
    version: '0.5.1',
    tag: 'v0.4.1',
  });
  const candidates = await manifest.buildPullRequests();
  assert.equal(candidates.length, 1);
  const pr = candidates[0];
  assert.equal(pr.version.toString(), '0.5.1');
  assert.match(pr.body.toString(), /v0\.4\.1\.\.\.v0\.5\.1/);
  assert.match(pr.body.toString(), /responsive camera/);
  assert.match(pr.body.toString(), /without system unzip/);
  assert.doesNotMatch(pr.body.toString(), /ancient feature|published fix/);
  const changes = new Map();
  for (const update of pr.updates.filter((item) =>
    ['CHANGELOG.md', '.release-please-manifest.json', 'package.json', 'package-lock.json'].includes(
      item.path,
    ),
  )) {
    const original = await github.getFileContentsOnBranch(update.path, 'main');
    changes.set(update.path, update.updater.updateContent(original.parsedContent));
  }
  assert.equal(changes.get('CHANGELOG.md').match(/## \[0\.5\.1\]/g).length, 1);
  assert.match(changes.get('CHANGELOG.md'), /Published fix/);
  assert.equal(JSON.parse(changes.get('.release-please-manifest.json'))['.'], '0.5.1');
  assert.doesNotMatch(changes.get('CHANGELOG.md'), /## \[0\.5\.0\]/);
  assert.equal(JSON.parse(changes.get('package.json')).version, '0.5.1');
  assert.equal(JSON.parse(changes.get('package.json')).devDependencies.fflate, '0.8.3');
  assert.equal(
    JSON.parse(changes.get('package-lock.json')).packages[''].devDependencies.fflate,
    '0.8.3',
  );
  assert.ok(reads.some((read) => read.path === 'package.json' && read.branch === 'main'));
  assert.ok(
    !reads.some(
      (read) =>
        read.branch === published &&
        !['.release-please-manifest.json', 'CHANGELOG.md'].includes(read.path),
    ),
  );
});
