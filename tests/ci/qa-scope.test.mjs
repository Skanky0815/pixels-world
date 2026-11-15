import { URL, fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import {
  readFileSync,
  readdirSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  renameSync,
} from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env, execPath } from 'node:process';
import { log } from 'node:console';
import { parse } from 'yaml';
import { classifyPath, selectQa } from '../../tools/qa-selection.ts';
import {
  browserProfile,
  landingSpecs,
  integrationSpecs,
  playSpecs,
} from '../../tools/qa-profiles.ts';
import { changedPaths, selectionFromEnvironment } from '../../tools/select-qa.mjs';

const workflow = parse(
  readFileSync(new URL('../../.github/workflows/qa.yml', import.meta.url), 'utf8'),
);
assert.deepEqual(workflow.on.push, { branches: ['main'] });
assert.equal(workflow.on.pull_request, null);
assert.deepEqual(workflow.jobs.e2e.needs, ['select', 'quality', 'e2e-shard']);
assert.equal(workflow.jobs.e2e.if, '${{ always() }}');
assert.equal(workflow.jobs.select.steps[0].with['fetch-depth'], 2);
assert.equal(
  workflow.jobs['e2e-shard'].strategy.matrix.shard,
  '${{ fromJSON(needs.select.outputs.shards) }}',
);
const selectStep = workflow.jobs.select.steps.find((step) => step.id === 'selection');
assert.equal(
  selectStep.env.QA_BASE_SHA,
  '${{ github.event.pull_request.base.sha || github.event.before }}',
);
assert.equal(selectStep.env.QA_HEAD_SHA, '${{ github.sha }}');
assert.equal(selectStep.env.QA_FULL_ROUND, '${{ inputs.full_round || false }}');
assert.match(selectStep.run, /node --experimental-strip-types tools\/select-qa.mjs/);
assert.equal(
  workflow.jobs['e2e-shard'].steps
    .find((step) => step.name === 'Browser-Szenarien')
    .run.includes('--grep @smoke'),
  false,
);

for (const [path, expected] of [
  ['game/landingpage/index.html', 'landing'],
  ['game/landingpage/legal.css', 'landing'],
  ['game/play/content/rooms/kitchen.ts', 'play'],
  ['game/play/ui/AlbumView.ts', 'play'],
  ['game/shared/base.css', 'both'],
  ['game/shared/i18n/de.ts', 'both'],
  ['game/shared/settings/storage.ts', 'all'],
  ['game/shared/pwa/updates.ts', 'all'],
  ['game/dev/game-debug.ts', 'all'],
  ['vite.config.ts', 'all'],
  ['package-lock.json', 'all'],
  ['tools/application-pages.ts', 'all'],
  ['.github/workflows/qa.yml', 'all'],
  ['tests/e2e/landing.spec.ts', 'both'],
  ['tests/e2e/help.spec.ts', 'landing'],
  ['tests/e2e/movement.spec.ts', 'all'],
  ['tests/e2e/new-feature.spec.ts', 'all'],
  ['tests/e2e/pwa-update.spec.ts', 'all'],
  ['tests/e2e/support.ts', 'all'],
  ['tests/e2e/fixtures/test.html', 'all'],
  ['tests/unit/input-state.test.ts', 'all'],
  ['tests/ci/fixture.md', 'all'],
  ['assets/landing/living-room.png', 'landing'],
  ['public/downloads/emojis.zip', 'landing'],
  ['assets/team/sara-portrait.png', 'both'],
  ['assets/pixel/pixel-sheet.png', 'both'],
  ['assets/objects/fridge/open.png', 'play'],
  ['assets/audio/books-0.wav', 'play'],
  ['assets/pixel/reference-v4/pixel.png', 'none'],
  ['assets/pixel/pixel-source-v1.png', 'none'],
  ['assets/objects/vase/vase-preview.png', 'none'],
  ['assets/banner.png', 'none'],
  ['docs/qa.md', 'none'],
  ['AGENTS.md', 'none'],
  ['game/play/content/README.md', 'none'],
  ['src/main.ts', 'all'],
  ['unknown/runtime.png', 'all'],
])
  assert.equal(classifyPath(path), expected, path);

for (const [paths, scope, quality] of [
  [['README.md'], 'none', false],
  [['game/landingpage/index.html'], 'landing', true],
  [['game/play/main.ts'], 'play', true],
  [['game/shared/ui/button.css'], 'both', true],
  [['game/landingpage/index.html', 'game/play/main.ts'], 'both', true],
  [['README.md', 'game/play/main.ts'], 'play', true],
  [['package.json', 'game/play/main.ts'], 'all', true],
  [undefined, 'all', true],
  [[], 'all', true],
]) {
  const plan = selectQa({ event: 'pull_request', paths });
  assert.equal(plan.scope, scope);
  assert.equal(plan.quality, quality);
  assert.deepEqual(plan.shards, scope === 'all' ? [1, 2, 3, 4] : [1]);
  assert.equal(selectQa({ event: 'push', paths }).scope, 'none');
  assert.equal(selectQa({ event: 'push', paths }).quality, quality);
}
for (const event of [
  'push',
  'pull_request',
  'workflow_dispatch',
  'workflow_run',
  'workflow_call',
]) {
  for (const requested of ['all', 'smoke', 'landing', 'play', 'both']) {
    const released = selectQa({ event, requested, fullRound: true, paths: ['README.md'] });
    assert.equal(released.scope, 'all');
    assert.equal(released.quality, true);
    assert.deepEqual(released.shards, [1, 2, 3, 4]);
  }
}
for (const requested of ['all', 'smoke', 'landing', 'play', 'both'])
  assert.equal(selectQa({ event: 'workflow_dispatch', requested }).scope, requested);
assert.throws(() => selectQa({ event: 'workflow_dispatch', requested: 'invalid' }));
assert.equal(selectQa({ event: 'workflow_run' }).scope, 'all');
assert.equal(selectionFromEnvironment({ QA_EVENT: 'pull_request' }).scope, 'all');

// The registry cannot silently forget an existing or newly added browser spec.
const files = readdirSync(new URL('../e2e/', import.meta.url))
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => name.slice(0, -8));
assert.deepEqual([...landingSpecs, ...integrationSpecs, ...playSpecs].sort(), files.sort());
for (const name of files) {
  assert.equal(
    browserProfile('landing').testMatch.test(`/tests/e2e/${name}.spec.ts`),
    [...landingSpecs, ...integrationSpecs].includes(name),
  );
  assert.equal(
    browserProfile('play').testMatch.test(`/tests/e2e/${name}.spec.ts`),
    [...playSpecs, ...integrationSpecs].includes(name),
  );
}
assert.equal(browserProfile('play').grep.test('landing.spec.ts actual start @integration'), true);
assert.equal(browserProfile('play').grep.test('landing.spec.ts pure static content'), false);
assert.equal(browserProfile('both').grep.test('help.spec.ts FAQ'), true);
assert.equal(browserProfile('both').grep.test('difficulty-help.spec.ts game help'), false);
assert.equal(browserProfile('both').grep.test('chromium tests/e2e/help.spec.ts FAQ'), true);
assert.equal(browserProfile('landing').testMatch.test(String.raw`C:\tests\e2e\help.spec.ts`), true);

const matches = (scope, name, tag) => {
  const profile = browserProfile(scope);
  return (
    (!profile.testMatch || profile.testMatch.test(`/tests/e2e/${name}.spec.ts`)) &&
    (!profile.grep || profile.grep.test(`chromium ${name}.spec.ts case ${tag}`))
  );
};
for (const name of files)
  for (const tag of ['', '@smoke', '@integration'])
    assert.equal(
      matches('both', name, tag),
      matches('landing', name, tag) || matches('play', name, tag),
      `${name}/${tag}: both is the union`,
    );

assert.deepEqual(browserProfile('all'), {});
const scripts = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).scripts;
assert.match(scripts['check:pr'], /E2E_SCOPE=all npm run test:e2e/);
assert.match(scripts['test:e2e:full'], /E2E_SCOPE=all/);
assert.throws(() => browserProfile('invalid'));

// Execute the real final shell gate, including failure of the selection job and docs-only skips.
const gate = workflow.jobs.e2e.steps.find(
  (step) => step.name === 'Qualität und geplanter Browserumfang müssen erfolgreich sein',
).run;
for (const scope of ['none', 'landing', 'play', 'both', 'smoke', 'all', 'invalid']) {
  for (const required of ['true', 'false']) {
    for (const selection of ['success', 'failure', 'skipped']) {
      for (const quality of ['success', 'failure', 'cancelled', 'skipped']) {
        for (const browser of ['success', 'failure', 'cancelled', 'skipped']) {
          const result = spawnSync('bash', ['-e', '-c', gate], {
            env: {
              ...env,
              E2E_SCOPE: scope,
              QUALITY_REQUIRED: required,
              SELECTION_RESULT: selection,
              QUALITY_RESULT: quality,
              SHARD_RESULT: browser,
            },
          });
          const valid = ['none', 'landing', 'play', 'both', 'smoke', 'all'].includes(scope);
          const expected =
            valid &&
            selection === 'success' &&
            (required === 'true'
              ? quality === 'success'
              : quality === 'skipped' && scope === 'none') &&
            browser === (scope === 'none' ? 'skipped' : 'success');
          assert.equal(
            result.status === 0,
            expected,
            `${scope}/${required}/${selection}/${quality}/${browser}`,
          );
        }
      }
    }
  }
}

// Real trees, not a fake Git API: over 3000 paths plus a cross-area rename and deletion.
const root = mkdtempSync(join(tmpdir(), 'pixels-qa-diff-'));
const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' }).toString().trim();
try {
  git('init', '-q');
  git('config', 'user.name', 'QA selection fixture');
  git('config', 'user.email', 'qa-selection@example.invalid');
  mkdirSync(join(root, 'game/play'), { recursive: true });
  writeFileSync(join(root, 'game/play/old.ts'), 'old');
  writeFileSync(join(root, 'game/play/deleted.ts'), 'deleted');
  git('add', '.');
  git('commit', '-qm', 'base');
  const base = git('rev-parse', 'HEAD');
  mkdirSync(join(root, 'game/landingpage'), { recursive: true });
  renameSync(join(root, 'game/play/old.ts'), join(root, 'game/landingpage/moved.ts'));
  rmSync(join(root, 'game/play/deleted.ts'));
  for (let i = 0; i < 3005; i++)
    writeFileSync(join(root, `game/landingpage/file-${i}.ts`), 'content');
  git('add', '.');
  git('commit', '-qm', 'changed');
  const paths = changedPaths(base, git('rev-parse', 'HEAD'), root);
  assert.equal(paths.length, 3008);
  assert.ok(paths.includes('game/play/old.ts'));
  assert.ok(paths.includes('game/play/deleted.ts'));
  assert.ok(paths.includes('game/landingpage/moved.ts'));
  assert.equal(selectQa({ event: 'pull_request', paths }).scope, 'both');
  assert.throws(() => changedPaths('--invalid', base, root));

  const head = git('rev-parse', 'HEAD');
  git('clone', '--quiet', '--depth=1', pathToFileURL(root).href, 'shallow');
  assert.equal(changedPaths(base, head, join(root, 'shallow')).length, 3008);
  const output = join(root, 'selection-output');
  const runSelection = (context) => {
    writeFileSync(output, '');
    execFileSync(
      execPath,
      [
        '--experimental-strip-types',
        fileURLToPath(new URL('../../tools/select-qa.mjs', import.meta.url)),
      ],
      {
        cwd: root,
        env: {
          ...env,
          QA_EVENT: 'pull_request',
          QA_BASE_SHA: base,
          QA_HEAD_SHA: head,
          QA_FULL_ROUND: 'false',
          GITHUB_OUTPUT: output,
          GITHUB_STEP_SUMMARY: '',
          ...context,
        },
        stdio: 'pipe',
      },
    );
    return Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split('=')),
    );
  };
  assert.deepEqual(runSelection({}), { scope: 'both', quality: 'true', shards: '[1]', total: '1' });
  writeFileSync(join(root, 'README.md'), 'Documentation only');
  git('add', 'README.md');
  git('commit', '-qm', 'docs only');
  assert.deepEqual(runSelection({ QA_BASE_SHA: head, QA_HEAD_SHA: git('rev-parse', 'HEAD') }), {
    scope: 'none',
    quality: 'false',
    shards: '[1]',
    total: '1',
  });
  assert.deepEqual(
    runSelection({
      QA_EVENT: 'workflow_run',
      QA_FULL_ROUND: 'true',
      QA_REQUESTED_SCOPE: 'landing',
    }),
    { scope: 'all', quality: 'true', shards: '[1,2,3,4]', total: '4' },
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
log(
  'QA-Auswahl: Bereiche, vollständiger Git-Diff, Release-Vollprüfung, Testregistrierung und tatsächliche Sammelgates geprüft.',
);
