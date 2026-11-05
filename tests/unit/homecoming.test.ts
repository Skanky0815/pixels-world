import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  HomecomingSequence,
  selectReaction,
  HOMECOMING_TIMING,
} from '../../src/game/domain/homecoming.ts';
import { SARA_ANIMATIONS, SARA_DIALOGUE } from '../../src/content/sara-reactions.ts';
import { RoundController, ROUND_CONFIG } from '../../src/game/domain/round-controller.ts';

// eslint-disable-next-line max-lines-per-function -- Alle angrenzenden Scorebereiche prüfen denselben Auswahlvertrag.
test('Reaktionen übernehmen die bestehenden Ärgergrenzen einschließlich 24/25 und 59/60', () => {
  for (const [score, anger] of [
    [0, 'calm'],
    [24, 'calm'],
    [25, 'annoyed'],
    [59, 'annoyed'],
    [60, 'angry'],
    [200, 'angry'],
  ] as const) {
    const selected = selectReaction(score, () => 0);

    assert.equal(selected.score, score);
    assert.equal(selected.anger, anger);
    assert.equal(selected.animationKey, SARA_ANIMATIONS[anger]);
    assert.equal(Object.isFrozen(selected), true);
  }
});

test('Jede Stufe hat mindestens drei erreichbare Dialoge; Zufall ist reproduzierbar', () => {
  for (const score of [0, 25, 60]) {
    const pool = SARA_DIALOGUE[selectReaction(score, () => 0).anger];

    assert.ok(pool.length >= 3);
    assert.equal(new Set(pool).size, pool.length);

    for (const [index, dialogue] of pool.entries())
      assert.equal(selectReaction(score, () => index / pool.length).dialogue, dialogue);
    assert.equal(selectReaction(score, () => 1).dialogue, pool.at(-1));
  }
});

test('Ungültige Scores und Zufallswerte können keine Reaktion starten', () => {
  for (const score of [-1, 0.5, NaN, Infinity]) assert.throws(() => selectReaction(score));

  for (const sample of [-1, 1.1, NaN, Infinity])
    assert.throws(() => selectReaction(0, () => sample));
});

// eslint-disable-next-line max-lines-per-function -- Der vollständige einmalige Ablauf prüft genaue Zeitgrenzen, stabile Auswahl und Abschluss im Zusammenhang.
test('Eintritt, Reaktion, Dialog und Abschluss erfolgen einmalig mit stabiler Auswahl', () => {
  const sequence = new HomecomingSequence();
  let draws = 0;

  sequence.advance(100_000);
  assert.equal(sequence.snapshot().stage, 'waiting');
  assert.equal(sequence.confirm(), false);
  assert.equal(
    sequence.start(25, () => {
      draws++;

      return 0.5;
    }),
    true,
  );
  const selected = sequence.snapshot().selection;

  assert.equal(
    sequence.start(99, () => {
      throw new Error('Duplicate random draw');
    }),
    false,
  );
  assert.equal(draws, 1);
  assert.equal(sequence.snapshot().stage, 'entering');
  assert.equal(sequence.confirm(), false);
  assert.equal(sequence.snapshot().animationKey, SARA_ANIMATIONS.enter);
  sequence.advance(HOMECOMING_TIMING.entering - 1);
  assert.equal(sequence.snapshot().stage, 'entering');
  sequence.advance(1);
  assert.equal(sequence.snapshot().stage, 'reacting');
  assert.equal(sequence.confirm(), false);
  assert.equal(sequence.snapshot().animationKey, SARA_ANIMATIONS.annoyed);
  sequence.advance(HOMECOMING_TIMING.reacting - 1);
  assert.equal(sequence.snapshot().stage, 'reacting');
  sequence.advance(1);
  assert.equal(sequence.snapshot().stage, 'dialogue');
  const dialogue = sequence.snapshot();

  sequence.advance(3_600_000);
  assert.deepEqual(sequence.snapshot(), dialogue, 'Reading time never confirms a text');
  assert.equal(sequence.confirm(), true);
  const complete = sequence.snapshot();

  assert.equal(complete.stage, 'complete');
  assert.equal(complete.animationKey, SARA_ANIMATIONS.idle);
  assert.deepEqual(complete.selection, selected);
  assert.equal(Object.isFrozen(complete), true);
  sequence.advance(5000);
  assert.equal(sequence.confirm(), false);
  assert.deepEqual(sequence.snapshot(), complete);
});

// eslint-disable-next-line max-lines-per-function -- Ungültige Schritte, großer gültiger Schritt und frischer Lifecycle-Zustand gehören zum gleichen Zeitvertrag.
test('Ungültige Deltas verändern nichts; große Schritte überspringen die Bestätigung nicht', () => {
  const sequence = new HomecomingSequence();

  sequence.start(60, () => 0);
  const before = sequence.snapshot();

  for (const delta of [-1, 0, NaN, Infinity]) sequence.advance(delta);
  assert.deepEqual(sequence.snapshot(), before);
  sequence.advance(100_000);
  assert.equal(sequence.snapshot().stage, 'dialogue');
  assert.equal(sequence.confirm(), true);
  sequence.advance(100_000);
  assert.equal(sequence.confirm(), false);
  assert.equal(new HomecomingSequence().snapshot().selection, null);
  assert.equal(new HomecomingSequence().snapshot().elapsedMs, 0);
});

// eslint-disable-next-line max-lines-per-function -- Phasenfolge und Score-Freeze werden trotz doppelter und verfrühter Signale gemeinsam abgesichert.
test('Rundenphasen akzeptieren nur geordnete Übergänge und erhalten den finalen Score', () => {
  const round = new RoundController(ROUND_CONFIG, () => 0);

  assert.equal(round.startReaction(), false);
  assert.equal(round.startReconciliation(), false);
  round.advance(60_000, 59);
  assert.equal(round.startReconciliation(), false);
  assert.equal(round.startReaction(), true);
  assert.equal(round.startReaction(), false);
  assert.equal(round.advance(100_000, 999), false);
  assert.equal(round.snapshot().phase, 'reaction');
  assert.equal(round.startReconciliation(), true);
  assert.equal(round.startReconciliation(), false);
  assert.equal(round.startReaction(), false);
  assert.equal(round.snapshot().phase, 'reconciliation');
  assert.equal(round.snapshot().finalChaosScore, 59);
  assert.equal(round.snapshot().elapsedMs, 60_000);
  round.reset();
  assert.equal(round.snapshot().phase, 'chaos');
  assert.equal(round.snapshot().finalChaosScore, null);
});
