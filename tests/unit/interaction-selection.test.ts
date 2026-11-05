import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CouchScratching } from '../../src/game/interactions/couch-scratching.ts';
import {
  overlaps,
  updateGroundInteractions,
  type Interactable,
  type InteractionContext,
} from '../../src/game/interactions/contracts.ts';

const context: InteractionContext = {
  time: 0,
  delta: 2000,
  input: { horizontal: 0, vertical: 0, jumpPressed: false, resetPressed: false, active: false },
  pixel: {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    bottom: 52,
    bodyWidth: 52,
    bodyHeight: 52,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    climbing: false,
    animationFrame: 0,
  },
};

test('Überlappende Ziele wählen genau eine Aktion; Wechsel/Bewegung starten die volle Wartezeit neu', () => {
  let firstEligible = true;
  const models = [new CouchScratching(undefined, 'a'), new CouchScratching(undefined, 'b')];
  const objects: Interactable[] = models.map((model, index) => ({
    id: String(index),
    eligible: (c) => !c.input.active && (index !== 0 || firstEligible),
    update: (c, active) => ({
      action: active ? 'scratching' : 'idle',
      event: model.update(c.delta, active),
    }),
    reset: () => model.reset(),
    destroy: () => {},
  }));

  assert.equal(updateGroundInteractions(objects, context).event?.objectId, 'a');
  assert.equal(models[1]?.snapshot().damage, 0);
  firstEligible = false;
  assert.equal(updateGroundInteractions(objects, { ...context, delta: 1000 }).event, undefined);
  assert.equal(models[0]?.snapshot().state, 'idle');
  updateGroundInteractions(objects, { ...context, input: { ...context.input, active: true } });
  assert.equal(updateGroundInteractions(objects, { ...context, delta: 1999 }).event, undefined);
  assert.equal(updateGroundInteractions(objects, { ...context, delta: 1 }).event?.objectId, 'b');
});

test('Kletterflächen behalten Phasers Kantenkontakt und schließen leere Flächen aus', () => {
  assert.equal(overlaps(context.pixel, { x: 52, y: 0, width: 20, height: 52 }), true);
  assert.equal(overlaps(context.pixel, { x: 53, y: 0, width: 20, height: 52 }), false);
  assert.equal(overlaps(context.pixel, { x: 0, y: 0, width: 0, height: 52 }), false);
});
