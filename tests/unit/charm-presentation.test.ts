import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { CharmPresentation } from '../../src/game/domain/charm-presentation.ts';
import { CHARM_TIMING } from '../../src/content/reconciliation.ts';

// eslint-disable-next-line max-lines-per-function -- Die gemeinsame Fixture koppelt nur Vorher-/Nachher-Snapshots an eine echte Modellaktion.
function game() {
  const charm = new Reconciliation(() => 0);
  const view = new CharmPresentation();
  const act = (action: () => void, elapsed = 0) => {
    const before = charm.snapshot();

    action();
    view.update(before, charm.snapshot(), elapsed);
  };

  charm.start(60);

  return { charm, view, act };
}

function correct(g: ReturnType<typeof game>) {
  g.act(() => g.charm.advance(CHARM_TIMING.cueMs), CHARM_TIMING.cueMs);
  g.act(() => g.charm.input(['left']));
}

// eslint-disable-next-line max-lines-per-function -- Ein vollständiger realer Modellablauf prüft die sichtbaren Varianten und unveränderte Minispielzustände.
test('Echte Treffer, Folgen und Finale wählen die Charme-Varianten ohne zusätzliche Spielaktionen', () => {
  const g = game();

  g.act(() => g.charm.confirm());
  correct(g);
  assert.equal(g.view.snapshot().action, 'purr');
  correct(g);
  assert.equal(g.view.snapshot().action, 'paw');
  correct(g);
  correct(g);
  assert.equal(g.view.snapshot().action, 'rub');
  const held = g.charm.snapshot();

  g.act(() => g.charm.advance(65_000), 65_000);
  assert.deepEqual(g.charm.snapshot(), held);
  assert.equal(g.view.snapshot().phase, 'loop');
  assert.equal(g.view.snapshot().action, 'rub');
  g.act(() => g.charm.confirm());
  assert.equal(g.view.snapshot().phase, 'release');

  for (let index = 0; index < 4; index++) correct(g);
  assert.equal(g.view.snapshot().action, 'headbutt');
  g.act(() => g.charm.confirm());

  for (let index = 0; index < 4; index++) correct(g);
  assert.equal(g.view.snapshot().action, 'roll');
  g.act(() => g.charm.advance(CHARM_TIMING.finaleMs), CHARM_TIMING.finaleMs);
  assert.equal(g.charm.snapshot().stage, 'complete');
  assert.equal(g.view.snapshot().phase, 'loop');
  assert.equal(g.view.snapshot().action, 'roll');
});

// eslint-disable-next-line max-lines-per-function -- Falsche Taste, Timeout und Neustart räumen dieselbe aktive Darstellung ohne verwaiste Timer auf.
test('Fehlversuche beenden die Pose, Neustart verwirft die alte Charme-Schleife', () => {
  const g = game();

  g.act(() => g.charm.confirm());
  correct(g);
  g.act(() => g.charm.advance(CHARM_TIMING.cueMs), CHARM_TIMING.cueMs);
  g.act(() => g.charm.input(['right']));
  assert.equal(g.view.snapshot().phase, 'release');
  g.act(() => {}, 500);
  assert.equal(g.view.snapshot().phase, 'idle');
  g.act(() => g.charm.confirm());
  correct(g);
  g.act(() => g.charm.advance(CHARM_TIMING.cueMs), CHARM_TIMING.cueMs);
  g.act(() => g.charm.advance(5000), 5000);
  assert.equal(g.charm.snapshot().stage, 'failed');
  assert.equal(g.view.snapshot().action, null);
  g.act(() => {}, 500);
  assert.equal(g.view.snapshot().phase, 'idle');
  const fresh = new Reconciliation().snapshot();

  g.view.update(g.charm.snapshot(), fresh, 0);
  assert.deepEqual(g.view.snapshot(), { action: null, elapsed: 0, phase: 'idle' });
});
