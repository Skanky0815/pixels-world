import assert from 'node:assert/strict';
import { log } from 'node:console';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (name) =>
  parse(readFileSync(new URL(`../../.github/workflows/${name}.yml`, import.meta.url), 'utf8'));
const workflow = read('release');
const { preflight, 'full-qa': qa, release, pages } = workflow.jobs;
const evaluate = (expression, context) =>
  Function(
    ...Object.keys(context),
    `return (${expression.replaceAll('full-qa', 'fullQa')});`,
  )(...Object.values(context));
const action = (job) => job.steps.find((step) => step.uses?.startsWith('googleapis/'));
const checkout = (job) => job.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
const download = (job) =>
  job.steps.find((step) => step.uses?.startsWith('actions/download-artifact@'));

// The preparation entry point uses Release Please's PR API only, never releases.
const prepare = preflight.steps.find((step) => step.id === 'release');
assert.equal(prepare.run, 'node tools/prepare-release.mjs');
const prepareSource = readFileSync(
  new URL('../../tools/prepare-release.mjs', import.meta.url),
  'utf8',
);
assert.match(prepareSource, /manifest\.createPullRequests\(\)/);
assert.doesNotMatch(prepareSource, /\.createReleases\(/);
for (const mode of ['prepare', 'publish']) {
  for (const needed of ['true', 'false']) {
    assert.equal(
      evaluate(prepare.if, {
        env: { RELEASE_MODE: mode },
        steps: { candidate: { outputs: { prepare_needed: needed } } },
      }),
      mode === 'prepare' && needed === 'true',
    );
  }
}
assert.equal(qa.needs, 'preflight');
assert.equal(qa.uses, './.github/workflows/qa.yml');
assert.equal(qa.with.full_round, true);
assert.equal(qa.with.release_tag, '${{ needs.preflight.outputs.tag }}');
assert.deepEqual(qa.permissions, { contents: 'read' });
assert.deepEqual(release.needs, ['preflight', 'full-qa']);
assert.equal(pages.needs, 'release');
for (const event of ['workflow_run', 'workflow_dispatch']) {
  for (const allowed of ['true', 'false']) {
    for (const result of ['success', 'failure', 'cancelled', 'skipped']) {
      for (const created of ['true', 'false']) {
        const context = {
          github: { event_name: event },
          needs: {
            preflight: { outputs: { publish_allowed: allowed } },
            fullQa: { result },
            release: { outputs: { release_created: created } },
          },
        };
        const candidate = event === 'workflow_run' && allowed === 'true';
        assert.equal(evaluate(qa.if, context), candidate);
        assert.equal(evaluate(release.if, context), candidate && result === 'success');
        assert.equal(evaluate(pages.if, context), event === 'workflow_run' && created === 'true');
      }
    }
  }
}
assert.equal(action(release).with['skip-github-release'], false);
assert.equal(action(release).with['skip-github-pull-request'], true);
assert.equal(checkout(preflight).with.ref, '${{ github.sha }}');
assert.equal(checkout(release).with.ref, '${{ needs.preflight.outputs.sha }}');
const recheck = release.steps.find((step) => step.id === 'source');
assert.equal(recheck.run, 'bash .github/scripts/auto-publish-candidate.sh');
assert.ok(release.steps.indexOf(recheck) < release.steps.indexOf(action(release)));
assert.ok(release.steps.indexOf(download(release)) < release.steps.indexOf(recheck));
for (const allowed of ['true', 'false'])
  assert.equal(
    evaluate(action(release).if, { steps: { source: { outputs: { publish_allowed: allowed } } } }),
    allowed === 'true',
  );
const verification = release.steps.find((step) => step.env?.TESTED_TAG);
assert.match(verification.run, /test "\$RELEASE_TAG" = "\$TESTED_TAG"/);
assert.match(verification.run, /test "\$RELEASE_SHA" = "\$TESTED_SHA"/);
assert.match(verification.run, /verify-release.sh/);
assert.deepEqual(workflow.on.workflow_run, {
  workflows: ['QA'],
  types: ['completed'],
  branches: ['main'],
});
assert.equal(workflow.on.workflow_dispatch, null);
assert.deepEqual(workflow.concurrency, { group: 'game-release', 'cancel-in-progress': false });
const ensure = preflight.steps.find(
  (step) => step.run === 'bash .github/scripts/ensure-main-qa.sh',
);
assert.equal(ensure.if, "env.RELEASE_MODE == 'prepare'");
assert.ok(
  preflight.steps.indexOf(ensure) < preflight.steps.findIndex((step) => step.id === 'source'),
);

// Pages consumes the tested artifact in this same run; it cannot rebuild or run QA again.
const rollout = read('pages');
assert.deepEqual(Object.keys(rollout.jobs), ['identity', 'build', 'deploy']);
assert.equal(rollout.jobs.build.needs, 'identity');
assert.equal(rollout.jobs.deploy.needs, 'build');
assert.equal(download(release).with.name, 'qa-pages-dist-${{ github.sha }}');
assert.deepEqual(download(rollout.jobs.build).with, download(release).with);
for (const job of Object.values(rollout.jobs)) {
  assert.equal(checkout(job).with.ref, '${{ inputs.release_sha }}');
  assert.ok(job.steps.some((step) => step.run === 'bash .github/scripts/verify-release.sh'));
  for (const step of job.steps) {
    assert.doesNotMatch(step.run ?? '', /npm|vite|test:e2e/);
    assert.equal(step.with?.['run-id'], undefined);
    assert.equal(step.with?.repository, undefined);
  }
}
log(
  'Release-Ablauf: vollständige QA vor Tag/Release, erneute Kandidatenprüfung und identischer Build bis Pages geprüft.',
);
