import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RoundController, ROUND_CONFIG } from '../../src/game/domain/round-controller.ts';

// eslint-disable-next-line max-lines-per-function -- Grenzwerte, Reproduzierbarkeit und einmalige Ziehung werden gemeinsam geprüft.
test('Rückkehrdauer ist inklusiv, reproduzierbar und wird nur einmal pro Runde gewählt', () => {
  for (const [sample, expected] of [
    [0, 60_000],
    [0.5, 82_500],
    [1, 105_000],
  ]) {
    let calls = 0;
    const round = new RoundController(ROUND_CONFIG, () => {
      calls++;

      return sample;
    });

    assert.equal(round.snapshot().returnAtMs, expected);
    round.advance(1000, 0);
    round.snapshot();
    assert.equal(calls, 1);
  }
});

// eslint-disable-next-line max-lines-per-function -- Ungültige Grenzen und Zufallswerte prüfen denselben Eingabevertrag.
test('Ungültige Dauergrenzen und Zufallsquellen werden abgelehnt', () => {
  for (const minDurationMs of [0, -1, NaN, Infinity, 1.5])
    assert.throws(() => new RoundController({ minDurationMs, maxDurationMs: 105_000 }));

  for (const maxDurationMs of [59_999, NaN, Infinity, 60_000.5])
    assert.throws(() => new RoundController({ minDurationMs: 60_000, maxDurationMs }));

  for (const sample of [-0.1, 1.1, NaN, Infinity])
    assert.throws(() => new RoundController(ROUND_CONFIG, () => sample));
  assert.equal(
    new RoundController({ minDurationMs: 10, maxDurationMs: 10 }, () => 1).snapshot().returnAtMs,
    10,
  );
});

// eslint-disable-next-line max-lines-per-function -- Zeitkategorien und ihre relativen Grenzen werden im selben Rundenverlauf geprüft.
test('Grobe Hinweise beziehen sich auf die einmal gewählte Dauer', () => {
  for (const sample of [0, 1]) {
    const round = new RoundController(ROUND_CONFIG, () => sample);
    const duration = round.snapshot().returnAtMs;

    assert.equal(round.snapshot().hint, 'time');
    round.advance(duration * 0.61, 0);
    assert.equal(round.snapshot().hint, 'soon');
    round.advance(duration * 0.25, 0);
    assert.equal(round.snapshot().hint, 'imminent');
  }
});

// eslint-disable-next-line max-lines-per-function -- Pause, Schwellenüberschreitung und unveränderlicher Abschluss sind ein zusammenhängender Lebenszyklus.
test('Nur aktive Zeit zählt; Rückkehr friert den letzten Score genau einmal ein', () => {
  const round = new RoundController(ROUND_CONFIG, () => 0);

  for (const delta of [NaN, Infinity, -1, 0]) assert.equal(round.advance(delta, 0), false);
  round.advance(90_000, 100, false);
  assert.equal(round.snapshot().elapsedMs, 0);
  assert.equal(round.advance(59_999, 3), false);
  assert.equal(round.advance(5000, 28), true);
  const finished = round.snapshot();

  assert.equal(finished.phase, 'returning');
  assert.equal(finished.elapsedMs, 60_000);
  assert.equal(finished.finalChaosScore, 28);
  assert.equal(finished.hint, 'home');
  assert.equal(Object.isFrozen(finished), true);
  assert.equal(round.advance(1000, 999), false);
  assert.deepEqual(round.snapshot(), finished);
});

// eslint-disable-next-line max-lines-per-function -- Genaues Grenzupdate und kompletter Reset mit neuer Ziehung werden gemeinsam geprüft.
test('Exakte Rückkehrgrenze und Reset mit neuer Zufallsauswahl', () => {
  const samples = [0, 1];
  const round = new RoundController(ROUND_CONFIG, () => samples.shift() ?? 0);

  assert.equal(round.advance(60_000, 0), true);
  round.reset();
  assert.deepEqual(round.snapshot(), {
    phase: 'chaos',
    endReason: null,
    elapsedMs: 0,
    returnAtMs: 105_000,
    finalChaosScore: null,
    hint: 'time',
  });
  assert.equal(samples.length, 0);
  assert.throws(() => round.advance(105_000, -1));
});
