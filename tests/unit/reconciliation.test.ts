import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { CHARM_PROFILES, CHARM_TIMING, DIRECTIONS } from '../../src/content/reconciliation.ts';

function ready(game: Reconciliation) {
  game.advance(CHARM_TIMING.cueMs);
}

function answer(game: Reconciliation) {
  const arrow = game.snapshot().expected;

  assert.ok(arrow);
  game.input([arrow]);
}

// eslint-disable-next-line max-lines-per-function -- Alle bestehenden Chaosgrenzen werden gegen die konfigurierten Profile und den einmaligen Start geprüft.
test('Charme startet einmal und verwendet dieselben Chaosstufen wie Sara', () => {
  for (const [score, level] of [
    [0, 'calm'],
    [24, 'calm'],
    [25, 'annoyed'],
    [59, 'annoyed'],
    [60, 'angry'],
  ] as const) {
    const game = new Reconciliation(() => 0);

    assert.equal(game.snapshot().stage, 'waiting');
    assert.equal(game.start(score), true);
    assert.equal(game.start(0), false);
    assert.equal(game.snapshot().level, level);
    assert.equal(game.snapshot().length, CHARM_PROFILES[level].length);
    assert.equal(game.snapshot().required, CHARM_PROFILES[level].sequences);
  }
});

// eslint-disable-next-line max-lines-per-function -- RNG-Grenzen, Reihenfolge und Sichtbarkeit der jeweils nächsten Taste werden gemeinsam geprüft.
test('Injizierter Zufall erzeugt geordnete Folgen; keine Gesamtfolge im Snapshot', () => {
  let draw = 0;
  const game = new Reconciliation(() => [0, 0.25, 0.5][draw++ % 3]);

  game.start(0);
  assert.equal(game.snapshot().expected, null);
  assert.equal('sequence' in game.snapshot(), false);

  for (const arrow of DIRECTIONS.slice(0, 3)) {
    ready(game);
    assert.equal(game.snapshot().expected, arrow);
    game.input([arrow]);
  }

  assert.equal(game.snapshot().successes, 1);
  assert.equal(Object.isFrozen(game.snapshot()), true);
});

// eslint-disable-next-line max-lines-per-function -- Die aktive Eingabefrist gilt exakt; Restzeiten und ungültige Deltas dürfen keinen Fortschritt erzeugen.
test('Zeitfenster prüfen die Grenze und ignorieren ungültige Zeitwerte', () => {
  const game = new Reconciliation(() => 1);

  game.start(0);
  ready(game);
  assert.equal(game.snapshot().expected, 'down');

  for (const delta of [0, -1, NaN, Infinity]) game.advance(delta);
  game.advance(1799);
  assert.equal(game.snapshot().stage, 'input');
  game.advance(1);
  assert.equal(game.snapshot().feedback, 'timeout');
  game.input(['down']);
  assert.equal(game.snapshot().successes, 0);
});

// eslint-disable-next-line max-lines-per-function -- Wiederholte Fehler, leere Eingaben und Mehrfachtasten testen Retry und begrenzte adaptive Hilfe.
test('Fehler starten neue Versuche ohne Game-over und erleichtern das Timing', () => {
  const game = new Reconciliation(() => 0);

  game.start(60);

  for (let i = 0; i < 20; i++) {
    ready(game);
    game.input([]);
    assert.equal(game.snapshot().stage, 'input');
    game.input(['left', 'up']);
    assert.equal(game.snapshot().feedback, 'wrong');
    game.advance(CHARM_TIMING.feedbackMs);
  }

  assert.equal(game.snapshot().failures, 20);
  assert.equal(game.snapshot().inputMs, CHARM_TIMING.maxInputMs);
  assert.equal(game.snapshot().successes, 0);
});

// eslint-disable-next-line max-lines-per-function -- Jede Schwierigkeit wird bis zum Abschluss gespielt; Fehler behalten zuvor verdiente Herzen.
test('Alle Profile sind abschließbar; Fehler verlieren keine Herzen, Abschluss bleibt stabil', () => {
  for (const score of [0, 25, 60]) {
    const game = new Reconciliation(() => 0);

    game.start(score);

    for (let i = 0; i < game.snapshot().required; i++) {
      for (let j = 0; j < game.snapshot().length; j++) {
        ready(game);
        answer(game);
      }

      assert.equal(game.snapshot().successes, i + 1);

      if (game.snapshot().stage === 'finale') break;
      game.advance(CHARM_TIMING.feedbackMs);
      ready(game);
      game.input(['right']);
      assert.equal(game.snapshot().successes, i + 1);
      game.advance(CHARM_TIMING.feedbackMs);
    }

    assert.equal(game.snapshot().stage, 'finale');
    game.advance(CHARM_TIMING.finaleMs);
    const complete = game.snapshot();

    assert.equal(complete.stage, 'complete');
    assert.equal(complete.progress, 1);
    game.advance(99999);
    game.input(['up']);
    assert.deepEqual(game.snapshot(), complete);
    assert.equal(new Reconciliation().snapshot().stage, 'waiting');
  }
});

test('Ungültiger RNG wird abgelehnt', () => {
  for (const sample of [-1, 1.1, NaN])
    assert.throws(() => new Reconciliation(() => sample).start(0));
});
