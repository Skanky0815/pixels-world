import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { KITCHEN_PREVIEW } from '../../src/content/rooms/kitchen-preview.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { populateSpawnSlots } from '../../src/game/content/spawn-slots.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';

const Random = createRequire(import.meta.url)(
  'phaser/src/math/random-data-generator/RandomDataGenerator.js',
) as new (seed: string[]) => { frac(): number };
const populate = (seed: string, difficulty: 'easy' | 'normal' | 'hard') => {
  const rng = new Random([seed]);

  return populateSpawnSlots(KITCHEN_PREVIEW, OBJECTS, difficulty, () => rng.frac());
};

// eslint-disable-next-line max-lines-per-function -- Alle Grade und Seeds prüfen die tatsächliche gemeinsame Belegung samt deterministischer Wiederholung und Zielauflage.
test('Küchenbilder variieren reproduzierbar; feste Regale und Napfplatz bleiben bei jedem Seed erhalten', () => {
  for (const difficulty of ['easy', 'normal', 'hard'] as const)
    for (let index = 0; index < 20; index++) {
      const seed = `kitchen-${index}`;
      const room = populate(seed, difficulty);

      assert.deepEqual(room, populate(seed, difficulty));
      assert.equal(
        room.objects.filter((o) => o.variant !== 'dry-food-bag').length,
        difficulty === 'easy' ? 1 : 2,
      );
      assert.ok(
        room.objects
          .filter((o) => o.variant !== 'dry-food-bag')
          .every((o) => OBJECTS[o.variant as keyof typeof OBJECTS].kind === 'picture'),
      );
      assert.equal(room.objects.filter((o) => o.variant === 'dry-food-bag').length, 1);
      assert.equal(room.platforms.length, 5);
      assert.ok(room.platforms.every((p) => p.durability?.stability === 'stable'));
      assert.equal(resolveRoom(room, OBJECTS).goal.surfaceY, 258);
    }
});

// eslint-disable-next-line max-lines-per-function -- Reservierungen für fehlende Objektfamilien bleiben leer und außerhalb von Saras und Pixels Zielbereich.
test('Küchen-Objektslots belegen nur den Futterbeutel und lassen den Napfbereich frei', () => {
  for (const platform of KITCHEN_PREVIEW.platforms) {
    if (!('slots' in platform)) continue;
    assert.deepEqual(platform.slots.count, { easy: 0, normal: 0, hard: 0 });
    assert.ok(platform.slots.entries.every((slot) => slot.pool.length === 0));
  }

  const counter = KITCHEN_PREVIEW.platforms.find((p) => p.id === 'kitchen-counter')!;

  assert.ok('slots' in counter);
  assert.ok(counter.slots.entries.every((slot) => counter.bounds.x + slot.x + 48 < 800));
  assert.deepEqual(KITCHEN_PREVIEW.objectSlots[0].count, { easy: 1, normal: 1, hard: 1 });
});
