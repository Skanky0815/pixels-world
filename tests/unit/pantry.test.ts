/* eslint-disable max-lines-per-function -- Varianten, physische Grenzen und eingefrorene Erfolgsfassungen werden als vollständige Datenverträge geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { PANTRY_PROFILES } from '../../game/play/assets/pantry-appearance.ts';
import { PANTRY } from '../../game/play/content/objects/pantry.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { KITCHEN } from '../../game/play/content/rooms/kitchen.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import type { ObjectCatalog } from '../../game/play/content/definitions.ts';
import { discoverAlbum } from '../../game/play/content/album/index.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS_V2,
  destructionTarget,
} from '../../game/play/content/achievements.ts';
import { AchievementProgress } from '../../game/play/album/achievements.ts';
import { AlbumCollection } from '../../game/play/album/collection.ts';
import { RoundAlbum } from '../../game/play/album/round.ts';
import { chaosEvent } from '../../game/play/domain/chaos-event.ts';
import type { RoundResult } from '../../game/play/domain/round-result.ts';
const result: RoundResult = {
  score: 24,
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

test('Alle Behälterzustände haben echte begrenzte PNGs mit binärem Alpha und 2×2-Clustern', () => {
  for (const [name, width, height] of [
    ['jar', 28, 34],
    ['tin', 32, 28],
    ['jar-broken', 76, 24],
    ['tin-opened', 84, 32],
    ['glass-shard', 8, 8],
  ] as const) {
    const image = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/pantry/${name}.png`, import.meta.url)),
    );

    assert.equal(image.width, width);
    assert.equal(image.height, height);
    assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 0));
    assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 255));
    assert.ok(image.data.every((value, index) => index % 4 !== 3 || value === 0 || value === 255));
    assertClusters(image);
  }

  assert.equal(PANTRY_PROFILES.jar.end.state, 'broken');
  assert.equal(PANTRY_PROFILES.tin.end.state, 'opened');
  assert.equal(PANTRY_PROFILES.jar.end.shards, 7);
  assert.equal(PANTRY_PROFILES.tin.end.shards, 0);
});

function assertClusters(image: PNG) {
  for (let y = 0; y < image.height; y += 2)
    for (let x = 0; x < image.width; x += 2) {
      const offset = (y * image.width + x) * 4;

      for (const delta of [4, image.width * 4, image.width * 4 + 4])
        assert.deepEqual(
          image.data.subarray(offset, offset + 4),
          image.data.subarray(offset + delta, offset + delta + 4),
        );
    }
}

test('Behälter nutzen tatsächliche Maße und passende Auflagen; falsche Zustände sind keine Albumfunde', () => {
  for (const [variant, definition] of Object.entries(PANTRY)) {
    const room = resolveRoom(
      {
        ...KITCHEN,
        objects: [
          {
            id: 'pantry',
            variant,
            placement: { mode: 'surface', x: 544, surfaceId: 'kitchen-table' },
          },
        ],
      },
      OBJECTS,
    );
    const item = room.objects[0];

    assert.equal(item.kind, 'pantry');

    if (item.kind !== 'pantry') throw new Error('Behälter fehlt');
    assert.equal(item.config.shelfY, 328);
    assert.equal(item.config.floorY, 468);
    assert.equal(item.config.support?.y, 328);
    const event = chaosEvent('pantry', definition.album.condition.kind, 1, definition.points);

    assert.equal(discoverAlbum(event, variant)?.entryId, definition.album.id);
    assert.equal(destructionTarget(event, 'pantry'), 'pantry');
    assert.equal(discoverAlbum(chaosEvent('pantry', 'nibble', 1, 2), variant), null);
    assert.throws(
      () =>
        resolveRoom(KITCHEN, {
          ...OBJECTS,
          [variant]: { ...definition, appearance: 'unknown' },
        } as unknown as ObjectCatalog),
      /appearance/,
    );
    assert.throws(
      () =>
        resolveRoom(
          {
            ...KITCHEN,
            objects: [
              {
                id: 'pantry',
                variant,
                placement: { mode: 'surface', x: 340, surfaceId: 'kitchen-table' },
              },
            ],
          },
          OBJECTS,
        ),
      /placement|support/,
    );
  }
});

test('Behälter sammeln sich nur nach Versöhnung; alte Zerstörungs- und Meisterwerkziele bleiben eingefroren', () => {
  assert.equal(DESTRUCTION_TARGETS_V2.length, 9);

  for (const [id, count] of [
    ['achievement.masterpiece-v1', 16],
    ['achievement.masterpiece-v2', 24],
    ['achievement.masterpiece-v3', 26],
    ['achievement.masterpiece-v4', 29],
  ] as const)
    assert.equal(ACHIEVEMENTS.find((entry) => entry.id === id)?.threshold, count);
  const progress = new AchievementProgress();

  progress.confirm(true, [
    ...DESTRUCTION_TARGETS_V2.filter((target) => target.id !== 'shelf').map((target) => target.id),
    'pantry',
  ]);
  assert.ok(!progress.snapshot().unlocked.includes('achievement.destruction-v2'));
  progress.confirm(true, ['shelf']);
  assert.ok(progress.snapshot().unlocked.includes('achievement.destruction-v2'));
  assert.ok(progress.snapshot().unlocked.includes('achievement.destruction-v4'));
  const collection = new AlbumCollection(new Set(['pantry.jar', 'pantry.tin']), undefined, false);

  for (const outcome of ['failed', 'success'] as const) {
    for (const definition of Object.values(PANTRY)) {
      const round = new RoundAlbum(collection);

      round.record(definition.album.id);
      round.recordDamage(
        chaosEvent('pantry', definition.album.condition.kind, 1, definition.points),
        'pantry',
        definition.album.id,
      );
      round.confirm({ ...result, outcome }, 'kitchen');
      assert.equal(round.confirmedBanners().includes(definition.album.id), outcome === 'success');
    }

    assert.equal(
      collection.achievementSnapshot().unlocked.includes('achievement.category-pantry-v4'),
      outcome === 'success',
    );
  }

  const restored = new AchievementProgress();

  restored.restore({ reconciliations: 0, ruined: [], unlocked: ['achievement.masterpiece-v3'] });
  assert.ok(restored.snapshot().unlocked.includes('achievement.masterpiece-v3'));
  assert.ok(!restored.snapshot().unlocked.includes('achievement.masterpiece-v4'));
});
