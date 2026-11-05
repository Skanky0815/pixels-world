import { ROUND_ENDINGS } from '../../src/content/round-endings.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundResult } from '../../src/game/domain/round-result.ts';
import { RoundController } from '../../src/game/domain/round-controller.ts';
import { HomecomingSequence } from '../../src/game/domain/homecoming.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { CHARM_TIMING } from '../../src/content/reconciliation.ts';

// eslint-disable-next-line max-lines-per-function -- Die echte Modellvorbereitung erzeugt konsistente Snapshots aller beteiligten Rundenphasen.
function setup(score = 60) {
  const round = new RoundController({ minDurationMs: 1, maxDurationMs: 1 });
  const home = new HomecomingSequence();
  const charm = new Reconciliation(() => 0);

  round.advance(1, score);
  home.start(score, () => 0);
  home.advance(2100);
  home.confirm();
  charm.start(score);

  return {
    round,
    home,
    charm,
    result: () => roundResult(round.snapshot(), home.snapshot(), charm.snapshot()),
  };
}

function winHeart(charm: Reconciliation) {
  charm.confirm();

  for (let step = 0; step < charm.snapshot().length; step++) {
    charm.advance(CHARM_TIMING.cueMs);
    charm.input(['left']);
  }
}

test('Kein Ergebnis vor terminalem Ausgang der Versöhnung', () => {
  const game = setup();

  assert.equal(game.result(), null);

  for (let i = 0; i < game.charm.snapshot().required; i++) winHeart(game.charm);
  assert.equal(game.charm.snapshot().stage, 'finale');
  assert.equal(game.result(), null);
  game.charm.advance(CHARM_TIMING.finaleMs);
  assert.equal(game.result()?.outcome, 'success');
});

// eslint-disable-next-line max-lines-per-function -- Ursprünglicher Chaosstand, Kommentar und neuer Ausgang bleiben getrennt und unveränderlich.
test('Ergebnis erhält Saras ursprüngliche Reaktion trotz erfolgreicher Versöhnung', () => {
  const game = setup();

  for (let i = 0; i < game.charm.snapshot().required; i++) winHeart(game.charm);
  game.charm.advance(CHARM_TIMING.finaleMs);
  const result = game.result();

  assert.equal(result?.score, 60);
  assert.equal(result?.reaction, 'Wütend');
  assert.equal(result?.dialogue, game.home.snapshot().selection?.dialogue);
  assert.equal(result?.hearts, result?.required);
  assert.equal(Object.isFrozen(result), true);
  game.round.advance(99999, 999);
  assert.deepEqual(game.result(), result);
});

// eslint-disable-next-line max-lines-per-function -- Auch Scheitern nach Teilfortschritt ist ein Ergebnis; Neustart entfernt es vollständig.
test('Gescheiterte Versöhnung behält verdiente Herzen; Reset entfernt das Ergebnis', () => {
  const game = setup(25);

  winHeart(game.charm);

  for (let i = 0; i < 2; i++) {
    game.charm.confirm();
    game.charm.advance(CHARM_TIMING.cueMs);
    game.charm.input(['right']);
  }

  assert.equal(game.result()?.outcome, 'failed');
  assert.equal(game.result()?.hearts, 1);
  assert.equal(game.result()?.score, 25);
  game.round.reset();
  assert.equal(game.result(), null);
});

// eslint-disable-next-line max-lines-per-function -- Alle Chaosgrenzen und beide Ausgänge werden mit tatsächlich abgeschlossenen Domain-Modellen geprüft.
test('Abschlusssprüche unterscheiden Ärgerstufe und Versöhnungsausgang an allen Grenzen', () => {
  const lines = new Set<string>();

  for (const [score, level] of [
    [0, 'calm'],
    [24, 'calm'],
    [25, 'annoyed'],
    [59, 'annoyed'],
    [60, 'angry'],
    [100, 'angry'],
  ] as const) {
    for (const outcome of ['success', 'failed'] as const) {
      const game = setup(score);

      finish(game, outcome);
      const result = game.result();

      assert.equal(result?.closingLine, ROUND_ENDINGS[level][outcome]);
      assert.equal(result?.outcome, outcome);
      assert.equal(result?.dialogue, game.home.snapshot().selection?.dialogue);
      assert.ok(result);
      lines.add(result.closingLine);
    }
  }

  assert.equal(lines.size, 6);
});

function finish(game: ReturnType<typeof setup>, outcome: 'success' | 'failed') {
  if (outcome === 'success') {
    for (let i = 0; i < game.charm.snapshot().required; i++) winHeart(game.charm);
    game.charm.advance(CHARM_TIMING.finaleMs);
  } else failTwice(game.charm);
}

function failTwice(charm: Reconciliation) {
  for (let i = 0; i < 2; i++) {
    charm.confirm();
    charm.advance(CHARM_TIMING.cueMs);
    charm.input(['right']);
  }
}
