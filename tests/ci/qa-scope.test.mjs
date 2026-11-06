import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { env } from 'node:process';
import { log } from 'node:console';

const source = readFileSync(new URL('../../.github/workflows/qa.yml', import.meta.url), 'utf8');
const scope = source.match(/E2E_SCOPE: \$\{\{ (.+) \}\}/)[1];
const shard = source.match(/shard: \$\{\{ (.+) \}\}/)[1];
const total = source.match(/total: \$\{\{ (.+) \}\}/)[1];
const enabled = source.match(/e2e-shard:\n {4}if: (.+)/)[1];
const run = (expression, github, inputs) =>
  Function('github', 'inputs', 'fromJSON', `return (${expression});`)(github, inputs, JSON.parse);

for (const [event, profile, count, active] of [
  ['pull_request', 'smoke', 1, true],
  ['push', 'none', 4, false],
  ['workflow_dispatch', 'all', 4, true],
]) {
  for (const full of [false, true]) {
    const github = { event_name: event };
    const inputs = { full_round: full };
    assert.equal(run(scope, github, inputs), full ? 'all' : profile);
    assert.equal(Boolean(run(enabled, github, inputs)), full || active);
    const countExpected = full ? 4 : count;
    assert.deepEqual(
      run(shard, github, inputs),
      Array.from({ length: countExpected }, (_, i) => i + 1),
    );
    assert.deepEqual(run(total, github, inputs), [countExpected]);
  }
}

const gate = source
  .split('      - name: Qualität und geplanter Browserumfang müssen erfolgreich sein')[1]
  .split('        run: |\n')[1]
  .replace(/^ {10}/gm, '');

for (const profile of ['smoke', 'all', 'none']) {
  for (const quality of ['success', 'failure', 'cancelled']) {
    for (const browser of ['success', 'failure', 'cancelled', 'skipped']) {
      const result = spawnSync('bash', ['-e', '-c', gate], {
        env: { ...env, E2E_SCOPE: profile, QUALITY_RESULT: quality, SHARD_RESULT: browser },
      });
      const expected =
        quality === 'success' && browser === (profile === 'none' ? 'skipped' : 'success');
      assert.equal(result.status === 0, expected, `${profile}/${quality}/${browser}`);
    }
  }
}
log('QA-Umfang: 6 Event-/Profilfälle und 36 tatsächliche Sammel-Gate-Kombinationen bestanden.');
