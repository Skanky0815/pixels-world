import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildPlaygroundRecipe,
  spawnPlaygroundObject,
  movePlaygroundObject,
  removePlaygroundObject,
  recipeForPlayground,
} from '../../game/play/content/playground-layout.ts';
import { playgroundRecipe, playgroundRecipeIds } from '../e2e/play/playground-recipe-data.ts';
const empty = () => buildPlaygroundRecipe({ base: 'empty', id: 'custom', objects: [] });
const vase = {
  id: 'vase',
  variant: 'blue-vase',
  placement: { mode: 'surface', x: 400, surfaceId: 'floor' },
} as const;

test('Spawnen, Verschieben, Entfernen und Kopieren erhalten einen gültigen unveränderten Ausgangsaufbau', () => {
  const base = empty();
  const spawned = spawnPlaygroundObject(base, vase);
  const moved = movePlaygroundObject(spawned, 'vase', { ...vase.placement, x: 500 });

  assert.equal(base.objects.length, 0);
  assert.equal(spawned.objects[0].placement.x, 400);
  assert.equal(moved.objects[0].placement.x, 500);
  assert.equal(removePlaygroundObject(moved, 'vase').objects.length, 0);
  assert.deepEqual(buildPlaygroundRecipe(recipeForPlayground(moved)).objects, moved.objects);
});

test('Ungültige Varianten, doppelte IDs und Positionen verändern den bestehenden Aufbau nicht', () => {
  const layout = spawnPlaygroundObject(empty(), vase);
  const before = JSON.stringify(layout);

  assert.throws(() => spawnPlaygroundObject(layout, vase));
  assert.throws(() => spawnPlaygroundObject(layout, { ...vase, id: 'new', variant: '__proto__' }));
  assert.throws(() => movePlaygroundObject(layout, 'vase', { ...vase.placement, x: -50 }));
  assert.throws(() => removePlaygroundObject(layout, 'missing'));
  assert.equal(JSON.stringify(layout), before);
});

test('Alle bisherigen Kontaktaufbauten verwenden dieselbe Spawn-Funktion ohne Labor-Raumkatalog', () => {
  for (const id of playgroundRecipeIds) {
    const recipe = playgroundRecipe(id)!;
    const layout = buildPlaygroundRecipe(recipe);

    assert.equal(layout.objects.length, recipe.objects.length);
    assert.deepEqual(layout.spawn, recipe.spawn);
    assert.equal(layout.id, id);
  }
});

test('Jede Katalogvariante kann über denselben Spawnpfad aufgebaut werden', async () => {
  const { playgroundRoom, PLAYGROUND_OBJECTS } = await import('../../game/dev/playground-room.ts');

  for (const id of Object.keys(PLAYGROUND_OBJECTS)) {
    const fixture = playgroundRoom(id).definition;
    const layout = spawnPlaygroundObject({ ...fixture, objects: [] }, fixture.objects[0]);

    assert.equal(layout.objects[0].variant, id);
  }
});

// eslint-disable-next-line max-lines-per-function -- Export und Import müssen Umgebung, Ziel und materialisierte Slots gemeinsam erhalten.
test('Schlafzimmer kopieren und laden erhält Umgebung, Schlafziel, Möbel und editierte Objekte', async () => {
  const { BEDROOM } = await import('../../game/play/content/rooms/bedroom.ts');
  const { populateSpawnSlots } = await import('../../game/play/content/spawn-slots.ts');
  const { OBJECTS } = await import('../../game/play/content/objects/catalog.ts');
  const layout = populateSpawnSlots(BEDROOM, OBJECTS, 'normal', () => 0.5);
  const recipe = recipeForPlayground(layout);
  const loaded = buildPlaygroundRecipe(recipe);

  assert.equal(recipe.base, 'bedroom');
  assert.equal(loaded.environment, 'bedroom');
  assert.deepEqual(loaded.goal, BEDROOM.goal);
  assert.deepEqual(loaded.platforms, layout.platforms);
  assert.deepEqual(loaded.objects, layout.objects);
  assert.deepEqual(loaded.decorations, layout.decorations);
});
