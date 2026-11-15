import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { env, execPath } from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { log } from 'node:console';
import { browserJobs, browserProfile, browserServers, specArea } from '../../tools/qa-profiles.ts';

const root = new URL('../../', import.meta.url);
function specs(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = `${prefix}${entry.name}`;
    return entry.isDirectory()
      ? specs(new URL(`${entry.name}/`, dir), `${name}/`)
      : entry.name.endsWith('.spec.ts')
        ? [name]
        : [];
  });
}
const files = specs(new URL('../e2e/', import.meta.url));
assert.ok(files.length > 0);
assert.ok(
  files.every((file) => /^(landingpage|play|integration)\//.test(file)),
  'Every spec has an explicit area, also in nested directories.',
);
assert.equal(specArea('landingpage/nested/new.spec.ts'), 'landing');
assert.equal(specArea('play/nested/new.spec.ts'), 'play');
assert.equal(specArea('integration/nested/new.spec.ts'), 'both');
assert.equal(specArea('unknown/new.spec.ts'), 'all');
assert.throws(() => browserProfile('invalid'));
assert.deepEqual(browserServers('landing-only'), { offline: false, dev: false });
assert.deepEqual(browserServers('integration-full'), { offline: true, dev: true });

const cache = new Map();
function collect(scope, origin = 'both', shard) {
  const key = `${scope}/${origin}/${shard ?? ''}`;
  if (cache.has(key)) return cache.get(key);
  const args = [
    fileURLToPath(new URL('node_modules/playwright/cli.js', root)),
    'test',
    '--list',
    '--reporter=json',
  ];
  if (shard) args.push(`--shard=${shard}`);
  const output = execFileSync(execPath, args, {
    cwd: fileURLToPath(root),
    env: { ...env, E2E_SCOPE: scope, E2E_ORIGIN_SCOPE: origin, E2E_TABLET_WEBKIT: '' },
    maxBuffer: 8 * 1024 * 1024,
  });
  const report = JSON.parse(output.toString());
  const ids = new Set();
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      assert.ok(!ids.has(spec.id), `Duplicate case ${spec.title}`);
      ids.add(spec.id);
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites) visit(suite);
  assert.ok(ids.size, `Profile ${key} selects tests`);
  cache.set(key, ids);
  return ids;
}
const union = (...sets) => new Set(sets.flatMap((set) => [...set]));
const equal = (a, b, label) => assert.deepEqual([...a].sort(), [...b].sort(), label);
const all = collect('all');
for (const scope of ['landing', 'play', 'both', 'smoke', 'integration', 'all']) {
  const jobs = browserJobs(scope, 'pull_request');
  const groups = jobs.map((job) => collect(job.scope, job.origin, `${job.shard}/${job.total}`));
  const selected = union(...groups);
  assert.equal(
    groups.reduce((total, group) => total + group.size, 0),
    selected.size,
    `${scope}: each planned case runs exactly once`,
  );
  equal(
    selected,
    collect(scope === 'smoke' ? 'both' : scope),
    `${scope}: jobs preserve the local profile`,
  );
  assert.equal(new Set(jobs.map((job) => job.report)).size, jobs.length);
}
equal(
  collect('both'),
  union(collect('landing'), collect('play')),
  'Both is exactly the union of the two application profiles',
);
const release = browserJobs('all', 'workflow_run');
const releaseCases = release.map((job) =>
  collect(job.scope, job.origin, `${job.shard}/${job.total}`),
);
assert.equal(
  releaseCases.reduce((n, cases) => n + cases.size, 0),
  all.size,
);
equal(union(...releaseCases), all, 'Release shards cover the complete suite');
log(
  'E2E-Bereiche: rekursive Erfassung, echte Playwright-Test-IDs, disjunkte PR-Gruppen und vollständige Release-Abdeckung geprüft.',
);
