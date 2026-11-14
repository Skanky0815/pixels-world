import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PeacefulGoal } from '../../src/game/domain/peaceful-goal.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { RoundController } from '../../src/game/domain/round-controller.ts';
import { HomecomingSequence } from '../../src/game/domain/homecoming.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { roundResult } from '../../src/game/domain/round-result.ts';
import { PEACEFUL_GOAL_LINES, PEACEFUL_FOOD_LINES } from '../../src/content/peaceful-goal.ts';
import { copy, resolveText } from '../../src/i18n/locale.ts';

function round(goal = true, score = 0) {
  const model = new RoundController({ minDurationMs: 10, maxDurationMs: 10 });

  model.advance(goal ? 1 : 10, score, true, goal);

  return model.snapshot();
}

test('Nur tatsächliches Ziel ohne ein einziges Schadensereignis löst aus', () => {
  const score = new ChaosScore();

  score.awardEvent(chaosEvent('sofa', 'scratch', 1, 0));
  assert.equal(score.score, 0);
  assert.equal(new PeacefulGoal().start(round(), score.count), false);
  assert.equal(new PeacefulGoal().start(round(false), 0), false);
  assert.equal(new PeacefulGoal().start(round(true, 1), 0), false);
  assert.equal(new PeacefulGoal().start(new RoundController().snapshot(), 0), false);
  assert.equal(new PeacefulGoal().start(round(), 0), true);
});

// eslint-disable-next-line max-lines-per-function -- Einmaligkeit, Wiederholungsschutz und beide Sprachen werden am selben ausgewählten Inhalt geprüft.
test('Auswahl erfolgt einmal, ohne direkte Wiederholung und mit DE/EN für jede Variante', () => {
  let draws = 0;
  const model = new PeacefulGoal();

  assert.equal(
    model.start(round(), 0, () => {
      draws++;

      return 0;
    }),
    true,
  );
  assert.equal(
    model.start(round(), 0, () => {
      draws++;

      return 1;
    }),
    false,
  );
  assert.equal(draws, 1);
  const previous = model.snapshot().line;
  const next = new PeacefulGoal();

  assert.ok(previous);
  next.start(round(), 0, () => 0, previous);
  assert.notEqual(next.snapshot().line, previous);

  for (const key of PEACEFUL_GOAL_LINES)
    assert.notEqual(resolveText(key, 'de'), resolveText(key, 'en'));
  assert.equal(Object.isFrozen(model.snapshot()), true);
});

// eslint-disable-next-line max-lines-per-function -- Der friedliche Abschluss wird ohne Start oder Manipulation des Minispiels vollständig durchlaufen.
test('Freundlicher Dialog bleibt bis zur Bestätigung; Auswertung braucht keine Herzen', () => {
  const home = new HomecomingSequence();
  const charm = new Reconciliation();
  const selected = new PeacefulGoal();
  const finished = round();

  selected.start(finished, 0, () => 0);
  const key = selected.snapshot().line;

  assert.ok(key);
  home.start(
    0,
    () => {
      throw new Error('Keine zweite Dialogauswahl');
    },
    null,
    copy(key),
  );
  home.advance(2100);
  assert.equal(home.snapshot().selection?.peaceful, true);
  assert.equal(roundResult(finished, home.snapshot(), charm.snapshot()), null);
  home.confirm();

  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    const result = roundResult(finished, home.snapshot(), charm.snapshot(), difficulty);

    assert.ok(result);
    assert.equal(result.peaceful, true);
    assert.equal(result.outcome, 'success');
    assert.equal(result.difficulty, difficulty);
    assert.equal(result.required, 0);
    assert.equal(result.hearts, 0);
    assert.equal(result.dialogue, copy(key));
  }

  assert.equal(charm.snapshot().stage, 'waiting');
  assert.equal(charm.snapshot().successes, 0);
});

// eslint-disable-next-line max-lines-per-function -- Alle Dialogvarianten müssen am realen friedlichen Zielabschluss auswählbar bleiben.
test('Friedlicher Napfabschluss verwendet Futterdialog statt Balltext', () => {
  for (const sample of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    const model = new PeacefulGoal();

    assert.equal(
      model.start(round(), 0, () => sample, undefined, PEACEFUL_FOOD_LINES),
      true,
    );
    assert.notEqual(model.snapshot().line, 'peacefulGoalBall');
    assert.ok(model.snapshot().line);
  }
});
