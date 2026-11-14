/* eslint-disable max-lines-per-function -- Neue Varianten, eingefrorene Erfolgsfassungen und Rundengrenzen werden als vollständige Datenverträge geprüft. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PNG } from 'pngjs';
import { DISH_PROFILES } from '../../src/game/assets/dish-appearance.ts';
import { ACHIEVEMENTS, DESTRUCTION_TARGETS } from '../../src/content/achievements.ts';
import { DESTRUCTION_VARIANTS } from '../../src/content/achievement-categories.ts';
import { AchievementProgress } from '../../src/game/album/achievements.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import type { RoundResult } from '../../src/game/domain/round-result.ts';

const result: RoundResult = {
  score: 20,
  goalReached: true,
  reaction: 'Entspannt',
  dialogue: '',
  difficulty: 'hard',
  closingLine: '',
  outcome: 'success',
  hearts: 1,
  required: 1,
  peaceful: false,
};

test('Geschirrgrafiken passen zu ihren tatsächlichen Körpermaßen und haben binäres Alpha', () => {
  for (const [name, profile] of Object.entries(DISH_PROFILES)) {
    const png = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/dishes/${name}.png`, import.meta.url)),
    );

    assert.equal(png.width, profile.width);
    assert.equal(png.height, profile.height);
    assert.ok(png.data.some((value, i) => i % 4 === 3 && value === 0));
    assert.ok(png.data.every((value, i) => i % 4 !== 3 || value === 0 || value === 255));

    assertClusters(png);
  }
});

test('Neue Objektarten ersetzen keine fehlenden v1-Ziele und widerrufen keine alten Freischaltungen', () => {
  const progress = new AchievementProgress();
  const oldDestruction = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.destruction-v1')!;
  const oldMaster = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.masterpiece-v1')!;

  assert.equal(oldDestruction.threshold, 7);
  assert.equal(oldMaster.threshold, 16);
  assert.equal(oldMaster.targets?.length, 16);
  progress.confirm(true, ['vase', 'couch', 'curtain', 'plant', 'books', 'food-bag', 'dish']);
  assert.ok(!progress.snapshot().unlocked.includes(oldDestruction.id));
  progress.confirm(true, ['picture', 'shelf']);
  assert.ok(progress.snapshot().unlocked.includes(oldDestruction.id));
  assert.ok(progress.snapshot().unlocked.includes('achievement.destruction-v2'));
  const reload = new AchievementProgress();

  reload.restore({ reconciliations: 0, ruined: [], unlocked: [oldMaster.id, oldDestruction.id] });
  assert.ok(reload.snapshot().unlocked.includes(oldMaster.id));
  assert.ok(!reload.snapshot().unlocked.includes('achievement.masterpiece-v2'));
  assert.equal(DESTRUCTION_TARGETS.length, 9);
  assert.ok(DESTRUCTION_VARIANTS.includes('dish.cup'));
});

test('Geschirrfunde und Varianten zählen erst nach erfolgreicher Versöhnung; Reset und Fehlschlag verwerfen sie', () => {
  const collection = new AlbumCollection(new Set(['dish.cup', 'dish.plate']), undefined, false);
  const abandoned = new RoundAlbum(collection);

  abandoned.recordDamage(chaosEvent('cup', 'break', 1, 20), 'dish', 'dish.cup');
  const nextRound = new RoundAlbum(collection);

  assert.deepEqual(nextRound.snapshot().pending, []);
  assert.deepEqual(collection.achievementSnapshot().ruined, []);
  assert.deepEqual(abandoned.confirmedBanners(), []);

  for (const outcome of ['failed', 'success'] as const) {
    const round = new RoundAlbum(collection);

    round.record('dish.cup');
    round.record('dish.plate');
    round.recordDamage(chaosEvent('cup', 'break', 1, 20), 'dish', 'dish.cup');
    round.recordDamage(chaosEvent('plate', 'break', 1, 16), 'dish', 'dish.plate');
    round.confirm({ ...result, outcome }, 'kitchen');
    assert.equal(
      collection.achievementSnapshot().unlocked.includes('achievement.category-dishes-v2'),
      outcome === 'success',
    );
    assert.equal(round.confirmedBanners().includes('dish.cup'), outcome === 'success');
    round.confirm({ ...result, outcome }, 'kitchen');
    assert.equal(
      round.confirmedBanners().filter((id) => id === 'dish.cup').length,
      outcome === 'success' ? 1 : 0,
    );
  }
});

test('Neue Raumfassung sammelt Wohnzimmer und Küche getrennt nach Schwierigkeit', () => {
  const progress = new AchievementProgress();

  progress.confirm(false, [], [], ['easy/living-room', 'normal/kitchen', 'hard-peaceful/kitchen']);
  assert.ok(progress.snapshot().unlocked.includes('achievement.rooms-easy-v1'));
  assert.ok(!progress.snapshot().unlocked.includes('achievement.rooms-easy-v2'));
  assert.ok(!progress.snapshot().unlocked.includes('achievement.rooms-normal-v2'));
  assert.ok(progress.snapshot().unlocked.includes('achievement.peaceful-kitchen-v1'));
  progress.confirm(false, [], [], ['easy/kitchen']);
  assert.ok(progress.snapshot().unlocked.includes('achievement.rooms-easy-v2'));
  assert.ok(!progress.snapshot().unlocked.includes('achievement.rooms-normal-v2'));
});

function assertClusters(png: PNG) {
  for (let y = 0; y < png.height; y += 2)
    for (let x = 0; x < png.width; x += 2) {
      const offset = (y * png.width + x) * 4;

      for (const delta of [4, png.width * 4, png.width * 4 + 4])
        assert.deepEqual(
          png.data.subarray(offset + delta, offset + delta + 4),
          png.data.subarray(offset, offset + 4),
        );
    }
}
