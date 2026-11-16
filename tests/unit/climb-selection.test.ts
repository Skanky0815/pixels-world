import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectClimbGrip } from '../../game/play/interactions/climb-selection.ts';
import type { ClimbGrip, InteractionContext } from '../../game/play/interactions/contracts.ts';

const pixel: InteractionContext['pixel'] = {
  x: 20,
  y: 20,
  left: 10,
  top: 10,
  bottom: 30,
  bodyWidth: 20,
  bodyHeight: 20,
  velocityX: 0,
  velocityY: 0,
  grounded: false,
  climbing: true,
  animationFrame: 15,
};
const grip = (kind: ClimbGrip['kind'], id = kind): ClimbGrip => ({
  id,
  ownerId: id,
  kind,
  area: { x: 15, y: 15, width: 20, height: 20 },
  speed: kind === 'curtain' ? 125 : 100,
  requireUp: kind !== 'curtain',
});

test('Überlagerung bevorzugt Vorhang vor Tischdecke vor Kühlschrank unabhängig von der Eingabereihenfolge', () => {
  const curtain = grip('curtain'),
    cloth = grip('tablecloth'),
    fridge = grip('fridge');

  assert.equal(selectClimbGrip([fridge, cloth, curtain], pixel), curtain);
  assert.equal(selectClimbGrip([cloth, fridge], pixel), cloth);
  assert.equal(selectClimbGrip([fridge], pixel), fridge);
});

test('Gleichrangige Griffe behalten ihre stabile Aufbaureihenfolge und Identität', () => {
  const left = { ...grip('fridge'), id: 'fridge:left' };
  const right = { ...grip('fridge'), id: 'fridge:right' };

  assert.equal(selectClimbGrip([left, right], pixel)?.id, 'fridge:left');
  assert.equal(selectClimbGrip([right, left], pixel)?.id, 'fridge:right');
});

test('Verlassene und verschwundene Griffe geben die nächste tatsächliche Kontaktfläche frei', () => {
  const curtain = { ...grip('curtain'), area: { x: 100, y: 100, width: 20, height: 20 } };
  const cloth = grip('tablecloth');

  assert.equal(selectClimbGrip([curtain, cloth], pixel), cloth);
  assert.equal(selectClimbGrip([curtain], pixel), undefined);
  assert.equal(selectClimbGrip([], pixel), undefined);
});
