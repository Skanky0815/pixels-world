import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debugScenario, finishDebugReconciliation } from '../../src/dev/game-debug-model.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';

const scenario = { target: 'chaos', score: 60, seconds: 90, seed: 42 } as const;

test('Debug-Szenarien validieren Grenzen und liefern unveränderliche Daten', () => {
  assert.deepEqual(debugScenario(scenario), scenario);
  assert.equal(Object.isFrozen(debugScenario(scenario)), true);
  assert.doesNotThrow(() => debugScenario({ ...scenario, score: 0, seconds: 1, seed: 0 }));
  assert.doesNotThrow(() =>
    debugScenario({ ...scenario, score: 10_000, seconds: 600, seed: 0xffffffff }),
  );
});

test('Ungültige Debug-Werte werden vor einem Neustart abgewiesen', () => {
  for (const value of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => debugScenario({ ...scenario, score: value }));
    assert.throws(() => debugScenario({ ...scenario, seconds: value }));
    assert.throws(() => debugScenario({ ...scenario, seed: value }));
  }
});

for (const score of [0, 25, 60]) {
  for (const success of [true, false]) {
    test(`Debug-Ergebnis folgt echter Versöhnung: Chaos ${score}, Erfolg ${success}`, () => {
      const charm = new Reconciliation(() => 0.4);

      charm.start(score);
      finishDebugReconciliation(charm, success);
      const state = charm.snapshot();

      assert.equal(state.stage, success ? 'complete' : 'failed');
      assert.equal(state.successes, success ? state.required : 0);
      assert.equal(state.failures, success ? 0 : 2);
    });
  }
}

test('Debug-Ergebnis ist wiederholbar ohne doppelte Herzen und benötigt einen Start', () => {
  const charm = new Reconciliation(() => 0);

  assert.throws(() => finishDebugReconciliation(charm, true), /nicht gestartet/);
  charm.start(60);
  finishDebugReconciliation(charm, true);
  const finished = charm.snapshot();

  finishDebugReconciliation(charm, true);
  assert.deepEqual(charm.snapshot(), finished);
});
