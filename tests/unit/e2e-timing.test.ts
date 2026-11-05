import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FAST_ROUND_CONFIG, roundConfigForBuild } from '../../tools/e2e-timing.ts';
import { ROUND_CONFIG, RoundController } from '../../src/game/domain/round-controller.ts';

test('Nur der kurze E2E-Build enthält die injizierbare Testkonfiguration', () => {
  for (const mode of ['production', 'development', 'preview'])
    for (const flag of [undefined, '0', '1', 'invalid'])
      assert.equal(roundConfigForBuild(mode, flag), undefined);
  assert.equal(roundConfigForBuild('e2e', '1'), undefined);
  assert.equal(roundConfigForBuild('e2e', '0'), FAST_ROUND_CONFIG);
  assert.equal(roundConfigForBuild('e2e', undefined), FAST_ROUND_CONFIG);
  assert.throws(() => roundConfigForBuild('e2e', 'invalid'));
});

// eslint-disable-next-line max-lines-per-function -- Testdauer und unveränderte Produktionsgrenzen werden als gemeinsamer Konfigurationsvertrag geprüft.
test('Kurze Runden verwenden dasselbe Modell und ändern die produktiven Grenzen nicht', () => {
  assert.equal(Object.isFrozen(FAST_ROUND_CONFIG), true);

  for (const [sample, expected] of [
    [0, 8_000],
    [1, 10_000],
  ]) {
    const round = new RoundController(FAST_ROUND_CONFIG, () => sample);

    assert.equal(round.snapshot().returnAtMs, expected);
    assert.equal(round.advance(expected, 25), true);
    assert.equal(round.snapshot().finalChaosScore, 25);
  }

  assert.deepEqual(ROUND_CONFIG, { minDurationMs: 60_000, maxDurationMs: 105_000 });
  assert.equal(new RoundController(undefined, () => 0).snapshot().returnAtMs, 60_000);
  assert.equal(new RoundController(undefined, () => 1).snapshot().returnAtMs, 105_000);
});
