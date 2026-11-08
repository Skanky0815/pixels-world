import assert from 'node:assert/strict';
import { log } from 'node:console';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../../.github/workflows/release.yml', import.meta.url),
  'utf8',
);
const expression = (pattern) => {
  const match = workflow.match(pattern);

  assert.ok(match, `Release-Verdrahtung fehlt: ${pattern}`);

  return match[1];
};
const action = expression(/id: release\n\s+if: (.+)/);
const pages = expression(/ {2}pages:\n\s+needs: release\n\s+if: (.+)/);
const skipRelease = expression(/skip-github-release: \$\{\{ (.+) \}\}/);
const skipPr = expression(/skip-github-pull-request: \$\{\{ (.+) \}\}/);
const evaluate = (code, event, allowed, prepare, created) =>
  Function(
    'github',
    'steps',
    'needs',
    `return (${code});`,
  )(
    { event_name: event },
    {
      source: { outputs: { publish_allowed: allowed } },
      candidate: { outputs: { prepare_needed: prepare } },
    },
    { release: { outputs: { release_created: created } } },
  );

for (const [event, allowed, prepare, created, execute, rollout] of [
  ['workflow_dispatch', 'false', 'true', 'false', true, false],
  ['workflow_dispatch', 'false', 'false', 'false', false, false],
  ['workflow_dispatch', 'false', 'true', 'true', true, false],
  ['workflow_run', 'false', '', 'false', false, false],
  ['workflow_run', 'true', '', 'false', true, false],
  ['workflow_run', 'true', '', 'true', true, true],
]) {
  assert.equal(evaluate(action, event, allowed, prepare, created), execute);
  assert.equal(evaluate(pages, event, allowed, prepare, created), rollout);
  assert.equal(
    evaluate(skipRelease, event, allowed, prepare, created),
    event === 'workflow_dispatch',
  );
  assert.equal(evaluate(skipPr, event, allowed, prepare, created), event === 'workflow_run');
}
assert.match(workflow, /workflow_dispatch:\n\s+workflow_run:/);
assert.doesNotMatch(workflow, /inputs\.mode|options:.*publish/);
assert.match(workflow, /workflows: \[QA\]\n\s+types: \[completed\]\n\s+branches: \[main\]/);
assert.match(workflow, /group: game-release\n\s+cancel-in-progress: false/);
assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
log(
  'Release-Verdrahtung: manuelles Prepare, geschütztes Auto-Publish und Pages nur nach neuem Release geprüft.',
);

const ensureStep = workflow.match(
  /- name: Main-QA für Release-Vorbereitung bereitstellen\n\s+if: (.+)/,
);
assert.ok(ensureStep);
for (const mode of ['prepare', 'publish'])
  assert.equal(
    Function('env', `return (${ensureStep[1]});`)({ RELEASE_MODE: mode }),
    mode === 'prepare',
  );
assert.ok(
  workflow.indexOf('run: bash .github/scripts/ensure-main-qa.sh') <
    workflow.indexOf('- name: QA und Veröffentlichungskandidat bestätigen'),
);
assert.match(workflow, /timeout-minutes: 30/);
