import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FeedbackModel, type FeedbackState } from '../../src/game/ui/feedback-model.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { RoundController } from '../../src/game/domain/round-controller.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { CHARM_TIMING } from '../../src/content/reconciliation.ts';
import { FEEDBACK } from '../../src/content/feedback.ts';

// eslint-disable-next-line max-lines-per-function -- Kleine Fixture hält echte Domain-Modelle und ihren lesenden Darstellungs-Snapshot zusammen.
function fixture() {
  const round = new RoundController({ minDurationMs: 1000, maxDurationMs: 1000 }, () => 0);
  const charm = new Reconciliation(() => 0);
  const state = (outcome: FeedbackState['outcome'] = null): FeedbackState => ({
    started: true,
    round: round.snapshot(),
    charm: charm.snapshot(),
    outcome,
  });

  return { round, charm, state, feedback: new FeedbackModel() };
}

// eslint-disable-next-line max-lines-per-function -- Derselbe Schaden darf auch nach Ablauf der Anzeige nicht erneut auftauchen; neue Stufen ersetzen die einzelne Punkteanzeige.
test('Punktefeedback ist pro Ereignis einmalig und auf einen Kanal begrenzt', () => {
  const { feedback, state } = fixture();
  const event = chaosEvent('sofa', 'scratch', 1, 3);

  feedback.damage(event);
  feedback.damage(event);
  assert.equal(feedback.snapshot().sequence, 1);
  assert.equal(feedback.snapshot().messages.score?.value, 3);
  feedback.advance(2000, state());
  const sequence = feedback.snapshot().sequence;

  feedback.damage(event);
  assert.equal(feedback.snapshot().sequence, sequence);
  assert.equal(feedback.snapshot().messages.score, undefined);
  feedback.damage(chaosEvent('sofa', 'scratch', 2, 3));
  assert.equal(feedback.snapshot().messages.score?.value, 3);
});

// eslint-disable-next-line max-lines-per-function -- Echte Domain-Übergänge erzeugen genau einen Hinweis; wiederholtes Rendern verändert weder Punkte noch Phase.
test('Phasenhinweise folgen gültigen Übergängen ohne sich pro Frame zu wiederholen', () => {
  const { feedback, state, round } = fixture();

  feedback.advance(0, state());
  const first = feedback.snapshot().sequence;

  feedback.advance(16, state());
  assert.equal(feedback.snapshot().sequence, first);
  round.advance(1000, 25);
  feedback.advance(16, state());
  assert.equal(feedback.snapshot().messages.phase?.key, 'feedbackReturn');
  round.startReaction();
  feedback.advance(16, state());
  assert.equal(feedback.snapshot().messages.phase?.key, 'feedbackReaction');
  assert.equal(round.snapshot().finalChaosScore, 25);
});

// eslint-disable-next-line max-lines-per-function -- Richtige Eingabe, wiederholter Snapshot und tatsächlicher Timeout prüfen Ereignisabgrenzung am echten Minispiel.
test('Versöhnungsfeedback unterscheidet neue Treffer und Fehler', () => {
  const { feedback, state, charm } = fixture();

  charm.start(60);
  charm.confirm();
  charm.advance(CHARM_TIMING.cueMs);
  feedback.advance(0, state());
  charm.input(['left']);
  feedback.advance(16, state());
  assert.equal(feedback.snapshot().messages.charm?.key, 'feedbackCorrect');
  const sequence = feedback.snapshot().sequence;

  feedback.advance(16, state());
  assert.equal(feedback.snapshot().sequence, sequence);
  charm.advance(CHARM_TIMING.cueMs);
  charm.advance(charm.snapshot().remainingMs);
  feedback.advance(16, state());
  assert.equal(feedback.snapshot().messages.charm?.key, 'feedbackTimeout');
  assert.equal(feedback.snapshot().messages.charm?.tone, 'negative');
  assert.equal(charm.snapshot().failures, 1);
});

// eslint-disable-next-line max-lines-per-function -- Präsentationszeit ist unabhängig von Domain-Timern; Nullzeit friert ein, Ablauf entfernt ausschließlich die Anzeige.
test('Anzeigen altern nur mit aktiver Präsentationszeit und verändern keine Rundendaten', () => {
  const { feedback, state, round } = fixture();

  feedback.damage(chaosEvent('vase', 'break', 1, 25));
  feedback.advance(100, state());
  const before = feedback.snapshot().messages.score;

  feedback.advance(0, state());
  feedback.advance(NaN, state());
  assert.deepEqual(feedback.snapshot().messages.score, before);
  assert.equal(Object.isFrozen(before), true);
  feedback.advance(FEEDBACK.scoreMs, state());
  assert.equal(feedback.snapshot().messages.score, undefined);
  assert.equal(round.snapshot().elapsedMs, 0);
  assert.ok(FEEDBACK.charmMs < CHARM_TIMING.cueMs);
});

// eslint-disable-next-line max-lines-per-function -- Beide Zielaktionen müssen vor Saras tatsächlicher Ankunft eine eigene Phase zeigen.
test('Zielaktion kündigt Sara erst nach ihrem Ende an', () => {
  for (const goalAction of ['food', 'toy'] as const) {
    const { feedback, round, state } = fixture();

    round.advance(1000, 0);
    feedback.advance(1, { ...state(), goalAction });
    assert.equal(
      feedback.snapshot().messages.phase?.key,
      goalAction === 'food' ? 'feedbackEating' : 'feedbackPlaying',
    );
    feedback.advance(1, state());
    assert.equal(feedback.snapshot().messages.phase?.key, 'feedbackReturn');
  }
});
