/* eslint-disable max-lines-per-function -- Auflagen, Fall und eingefrorene Erfolgsziele werden als vollständige Datenverträge geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { PlantSupport } from '../../game/play/interactions/plant-support.ts';
import { HERBS } from '../../game/play/content/objects/herbs.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { discoverAlbum } from '../../game/play/content/album/index.ts';
import { KITCHEN } from '../../game/play/content/rooms/kitchen.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import { ACHIEVEMENTS } from '../../game/play/content/achievements.ts';
import { AchievementProgress } from '../../game/play/album/achievements.ts';
import { AlbumCollection } from '../../game/play/album/collection.ts';
import { RoundAlbum } from '../../game/play/album/round.ts';
import { chaosEvent } from '../../game/play/domain/chaos-event.ts';
import type { RoundResult } from '../../game/play/domain/round-result.ts';
const shelf = { x: 100, y: 300, width: 60, height: 16 };
const floor = { x: 0, y: 468, width: 960, height: 72 };
const result: RoundResult = {
  score: 10,
  goalReached: true,
  reaction: 'Entspannt',
  dialogue: '',
  difficulty: 'normal',
  closingLine: '',
  outcome: 'success',
  hearts: 1,
  required: 1,
  peaceful: false,
};

test('Auflage und Boden sind getrennt; Erde passt auf schmale Träger und fällt gemeinsam mit dem Topf', () => {
  const support = new PlantSupport(130, shelf, floor);

  assert.equal(support.snapshot().y, 300);
  assert.deepEqual(support.soil(), { x: 130, y: 301, width: 60 });
  assert.equal(support.release({ ...shelf, y: 320 }), false);
  assert.equal(support.release({ ...shelf, x: 140 }), false);
  assert.equal(support.release(shelf), true);
  assert.equal(support.release(shelf), false);
  support.advance(120);
  const falling = support.snapshot();

  assert.ok(falling.y > 300 && falling.y < 468);
  assert.ok(falling.velocityY > 0);
  assert.equal(support.soil().y, falling.y + 1);
  support.advance(NaN);
  support.advance(-1);
  support.advance(0);
  assert.deepEqual(support.snapshot(), falling);
  support.advance(1000);
  assert.deepEqual(support.snapshot(), { y: 468, dropping: false, velocityY: 0 });
  assert.equal(support.soil().y, 469);
  support.reset();
  assert.deepEqual(support.snapshot(), { y: 300, dropping: false, velocityY: 0 });
  assert.equal(support.release(shelf), true);
  assert.equal(new PlantSupport(130, floor, floor).release(floor), false);
});

test('Jede Kräutervariante hat echte Grafiken, eine erhöhte Auflage und zwei gültige Fundauslöser', () => {
  for (const [variant, definition] of Object.entries(HERBS)) {
    const room = resolveRoom(
      {
        ...KITCHEN,
        objects: [
          {
            id: 'herb',
            variant,
            placement: { mode: 'surface', x: 660, surfaceId: 'kitchen-counter' },
          },
        ],
      },
      OBJECTS,
    );
    const plant = room.objects.find((entry) => entry.kind === 'plant')!;

    assert.equal(plant.kind, 'plant');

    if (plant.kind !== 'plant') throw new Error('Pflanze fehlt');
    assert.equal(plant.config.floorY, 468);
    assert.equal(plant.config.support?.y, 258);
    assert.equal(
      discoverAlbum(chaosEvent('herb', 'nibble', 1, 2), variant)?.entryId,
      definition.album.id,
    );
    assert.equal(
      discoverAlbum(chaosEvent('herb', 'tip', 2, 10), variant)?.entryId,
      definition.album.id,
    );
    assert.equal(discoverAlbum(chaosEvent('herb', 'tip', 1, 10), variant), null);

    for (const state of ['intact', 'bitten']) {
      const image = PNG.sync.read(
        readFileSync(
          new URL(
            `../../assets/objects/herbs/${definition.appearance}-${state}.png`,
            import.meta.url,
          ),
        ),
      );

      assert.equal(image.width, 40);
      assert.equal(image.height, 60);
      assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 0));
      assert.ok(
        image.data.every((value, index) => index % 4 !== 3 || value === 0 || value === 255),
      );
    }
  }
});

test('Alter Pflanzen- und Gesamtkatalog bleibt eingefroren; neue Pflanzen sammeln sich nur nach erfolgreicher Versöhnung', () => {
  const oldPlants = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.category-plants-v1')!;
  const oldMaster = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.masterpiece-v2')!;

  assert.deepEqual(oldPlants.targets, ['plant.catgrass']);
  assert.equal(oldMaster.threshold, 24);
  assert.equal(
    ACHIEVEMENTS.find((entry) => entry.id === 'achievement.masterpiece-v3')!.threshold,
    26,
  );
  const collection = new AlbumCollection(
    new Set(['plant.basil', 'plant.parsley', 'plant.mint']),
    undefined,
    false,
  );

  for (const outcome of ['failed', 'success'] as const) {
    for (const definition of Object.values(HERBS)) {
      const round = new RoundAlbum(collection);

      round.record(definition.album.id);
      round.recordDamage(chaosEvent('herb', 'nibble', 1, 2), 'plant', definition.album.id);
      round.confirm({ ...result, outcome }, 'kitchen');
    }

    assert.deepEqual(collection.achievementSnapshot().ruinedVariants, []);
  }

  for (const definition of Object.values(HERBS)) {
    const round = new RoundAlbum(collection);

    round.recordDamage(chaosEvent('herb', 'tip', 2, 10), 'plant', definition.album.id);
    round.recordDamage(chaosEvent('herb', 'tip', 2, 10), 'plant', definition.album.id);
    round.confirm(result, 'kitchen');
  }

  assert.ok(!collection.achievementSnapshot().unlocked.includes('achievement.category-plants-v3'));
  const grass = new RoundAlbum(collection);

  grass.recordDamage(chaosEvent('grass', 'tip', 2, 10), 'plant', 'plant.catgrass');
  grass.confirm(result, 'living-room');
  assert.ok(collection.achievementSnapshot().unlocked.includes('achievement.category-plants-v3'));
  const restored = new AchievementProgress();

  restored.restore({ reconciliations: 0, ruined: [], unlocked: [oldPlants.id, oldMaster.id] });
  assert.ok(restored.snapshot().unlocked.includes(oldMaster.id));
  assert.ok(!restored.snapshot().unlocked.includes('achievement.masterpiece-v3'));
});
