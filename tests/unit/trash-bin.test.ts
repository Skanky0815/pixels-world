/* eslint-disable max-lines-per-function -- Echte PNGs, Bodenanker und eingefrorene Fortschrittsfassungen bleiben als vollständige Verträge prüfbar. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { TRASH_BIN_PROFILE } from '../../src/game/assets/trash-bin-profile.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { KITCHEN } from '../../src/content/rooms/kitchen.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { discoverAlbum } from '../../src/content/album/index.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS_V3,
  destructionTarget,
} from '../../src/content/achievements.ts';
import { AchievementProgress } from '../../src/game/album/achievements.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import type { RoundResult } from '../../src/game/domain/round-result.ts';
const result: RoundResult = {
  score: 22,
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

test('Mülleimerbilder sind echte begrenzte PNGs mit transparentem Hintergrund und 2×2-Clustern', () => {
  for (const [name, width, height] of [
    ['intact', 40, 48],
    ['spilled', 110, 38],
  ] as const) {
    const image = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/trash-bin/${name}.png`, import.meta.url)),
    );

    assert.equal(image.width, width);
    assert.equal(image.height, height);
    assert.ok(image.data.some((v, i) => i % 4 === 3 && v === 0));
    assert.ok(image.data.some((v, i) => i % 4 === 3 && v === 255));
    assert.ok(image.data.every((v, i) => i % 4 !== 3 || v === 0 || v === 255));
    assertClusters(image);
  }

  assert.equal(TRASH_BIN_PROFILE.mass, 3);
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

test('Mülleimer braucht Boden und vollständigen Raum für beide Kipprichtungen; nur Ausleeren zählt als Fund', () => {
  const definition = OBJECTS['cream-trash-bin'];
  const room = (x: number, surfaceId = 'floor') => ({
    ...KITCHEN,
    objects: [
      {
        id: 'bin',
        variant: 'cream-trash-bin',
        placement: { mode: 'surface' as const, x, surfaceId },
      },
    ],
  });
  const item = resolveRoom(room(560), OBJECTS).objects[0];

  assert.equal(item.kind, 'trash-bin');

  if (item.kind !== 'trash-bin') throw new Error('Mülleimer fehlt');
  assert.equal(item.config.floorY, 468);
  assert.equal(item.config.supportY, 468);
  assert.throws(() => resolveRoom(room(544, 'kitchen-table'), OBJECTS), /floor support/);
  assert.throws(() => resolveRoom(room(40), OBJECTS), /geometry/);
  const spill = chaosEvent('bin', 'spill', 1, 22);

  assert.equal(discoverAlbum(spill, 'cream-trash-bin')?.entryId, definition.album.id);
  assert.equal(destructionTarget(spill, 'trash-bin'), 'trash-bin');
  assert.equal(discoverAlbum(chaosEvent('bin', 'nibble', 1, 1), 'cream-trash-bin'), null);
});

test('Mülleimer-Erfolge bestätigen nur erfolgreiche Runden und lassen alte Zehnerziele und Meisterwerke erhalten', () => {
  const objective = (id: string) => ACHIEVEMENTS.find((entry) => entry.id === id)!;

  assert.equal(DESTRUCTION_TARGETS_V3.length, 10);
  assert.equal(objective('achievement.destruction-v4').threshold, 10);
  assert.equal(objective('achievement.masterpiece-v4').threshold, 29);
  assert.equal(objective('achievement.destruction-v5').threshold, 11);
  assert.equal(objective('achievement.masterpiece-v5').threshold, 32);
  const collection = new AlbumCollection(new Set(['trash-bin.cream']), undefined, false);

  for (const outcome of ['failed', 'success'] as const) {
    const round = new RoundAlbum(collection);

    round.record('trash-bin.cream');
    round.recordDamage(chaosEvent('bin', 'spill', 1, 22), 'trash-bin', 'trash-bin.cream');
    round.confirm({ ...result, outcome }, 'kitchen');
    assert.equal(round.confirmedBanners().includes('trash-bin.cream'), outcome === 'success');
    assert.equal(
      collection.achievementSnapshot().unlocked.includes('achievement.category-trash-bins-v5'),
      outcome === 'success',
    );
  }

  const progress = new AchievementProgress();

  progress.restore({ reconciliations: 0, ruined: [], unlocked: ['achievement.masterpiece-v4'] });
  assert.ok(progress.snapshot().unlocked.includes('achievement.masterpiece-v4'));
  assert.ok(!progress.snapshot().unlocked.includes('achievement.masterpiece-v5'));
  const earlier = new AchievementProgress();

  earlier.confirm(
    true,
    DESTRUCTION_TARGETS_V3.map((t) => t.id),
  );
  assert.ok(earlier.snapshot().unlocked.includes('achievement.destruction-v4'));
  assert.ok(!earlier.snapshot().unlocked.includes('achievement.destruction-v5'));
  earlier.confirm(true, ['trash-bin']);
  assert.ok(earlier.snapshot().unlocked.includes('achievement.destruction-v5'));
});
