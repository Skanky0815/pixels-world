import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HomecomingSequence, HOMECOMING_TIMING } from '../../src/game/domain/homecoming.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { CHARM_TIMING } from '../../src/content/reconciliation.ts';
import { homecomingPortrait, charmPortrait } from '../../src/game/domain/dialogue-portrait.ts';

// eslint-disable-next-line max-lines-per-function -- Alle Ärgerstufen durchlaufen dieselben echten Heimkehrphasen.
test('Heimkehrporträts folgen Phase und Ärger statt zufälligem Dialogtext', () => {
  for (const score of [0, 25, 60]) {
    const home = new HomecomingSequence();

    assert.equal(homecomingPortrait(home.snapshot()), null);
    home.start(score, () => 0);
    assert.equal(homecomingPortrait(home.snapshot()), 'sara-neutral');
    home.advance(HOMECOMING_TIMING.entering);
    assert.equal(
      homecomingPortrait(home.snapshot()),
      score === 0 ? 'sara-neutral' : 'sara-surprised',
    );
    home.advance(HOMECOMING_TIMING.reacting);
    assert.equal(
      homecomingPortrait(home.snapshot()),
      score === 0 ? 'sara-neutral' : 'sara-annoyed',
    );
    home.confirm();
    assert.equal(homecomingPortrait(home.snapshot()), 'pixel-neutral');
  }
});

// eslint-disable-next-line max-lines-per-function -- Lesetext, Eingabe und beide Feedbackarten werden ohne Zustandssetter durchlaufen.
test('Charme zeigt Pixel bei der Eingabe und Sara beim Antworten', () => {
  const charm = new Reconciliation(() => 0);

  assert.equal(charmPortrait(charm.snapshot()), null);
  charm.start(25);
  assert.equal(charmPortrait(charm.snapshot()), 'pixel-neutral');
  charm.confirm();
  charm.advance(CHARM_TIMING.cueMs);
  assert.equal(charmPortrait(charm.snapshot()), 'pixel-neutral');
  charm.input(['right']);
  assert.equal(charmPortrait(charm.snapshot()), 'sara-neutral');
  charm.confirm();

  for (let step = 0; step < charm.snapshot().length; step++) {
    charm.advance(CHARM_TIMING.cueMs);
    charm.input(['left']);
  }

  assert.equal(charmPortrait(charm.snapshot()), 'sara-friendly');
});
