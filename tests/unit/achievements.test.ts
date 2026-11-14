/* eslint-disable max-lines-per-function -- Schwellen, Migration und einmalige Rundenbestätigung werden als vollständige Fortschrittsverträge geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS,
  destructionTarget,
} from '../../src/content/achievements.ts';
import { AchievementProgress } from '../../src/game/album/achievements.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import type { RoundResult } from '../../src/game/domain/round-result.ts';
import { COUCH_SCRATCH } from '../../src/game/interactions/couch-scratching.ts';
import { CURTAIN_SLIDE } from '../../src/game/interactions/curtain-sliding.ts';

const success: RoundResult = {
  score: 18,
  goalReached: false,
  reaction: 'Entspannt',
  dialogue: '',
  difficulty: 'normal',
  closingLine: '',
  outcome: 'success',
  hearts: 1,
  required: 1,
  peaceful: false,
};
const failed: RoundResult = { ...success, outcome: 'failed', hearts: 0 };
const peaceful: RoundResult = {
  ...success,
  peaceful: true,
  outcome: 'success',
  goalReached: true,
  hearts: 0,
  required: 0,
};
const ids = new Set(['vase.blue']);

function memory(raw: string | null = null) {
  let value = raw;
  let writes = 0;

  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
      writes++;
    },
    writes: () => writes,
  };
}

function ruin(round: RoundAlbum, index: number) {
  const target = DESTRUCTION_TARGETS[index];

  round.recordDamage(chaosEvent('instance', target.event, target.stage, 1), target.object);
}

test('Die sieben festen Ziele verlangen den endgültigen Zustand, nicht irgendeinen Schaden', () => {
  assert.deepEqual(
    DESTRUCTION_TARGETS.map((target) => target.id),
    ['vase', 'couch', 'curtain', 'plant', 'books', 'picture', 'shelf'],
  );
  assert.equal(DESTRUCTION_TARGETS[1].stage, COUCH_SCRATCH.maxDamage);
  assert.equal(DESTRUCTION_TARGETS[2].stage, CURTAIN_SLIDE.maxDamage);

  for (const target of DESTRUCTION_TARGETS) {
    assert.equal(
      destructionTarget(chaosEvent('a', target.event, target.stage, 1), target.object),
      target.id,
    );
    assert.equal(
      destructionTarget(chaosEvent('a', target.event, target.stage, 1), 'future-object'),
      undefined,
    );

    if (target.stage > 1)
      assert.equal(
        destructionTarget(chaosEvent('a', target.event, target.stage - 1, 1), target.object),
        undefined,
      );
  }

  assert.equal(destructionTarget(chaosEvent('rug', 'hairball', 1, 1), 'carpet'), undefined);
});

test('Alle Versöhnungsschwellen werden beim Überschreiten genau einmal freigeschaltet', () => {
  const progress = new AchievementProgress();

  for (let round = 1; round <= 101; round++) {
    const earned = progress.confirm(true, []);

    assert.deepEqual(
      earned,
      [1, 10, 50, 100].includes(round) ? [`achievement.angel-${round}`] : [],
    );
    assert.equal(progress.snapshot().reconciliations, round);
  }

  assert.equal(progress.snapshot().unlocked.length, 4);
  assert.ok(Object.isFrozen(progress.snapshot().unlocked));
  assert.deepEqual(
    progress.confirm(
      false,
      DESTRUCTION_TARGETS.map((target) => target.id),
    ),
    [],
  );
  assert.deepEqual(progress.snapshot().ruined, []);
});

test('Ergebniswiederholung, später Schaden und Reload zählen keine zweite Runde; gemeinsamer Schreibvorgang', () => {
  const storage = memory();
  const collection = new AlbumCollection(ids, storage);
  const round = new RoundAlbum(collection);

  round.record('vase.blue');
  ruin(round, 0);
  assert.deepEqual(round.confirm(null), []);
  assert.equal(collection.achievementSnapshot().reconciliations, 0);
  round.confirm(success);
  round.confirm(success);
  ruin(round, 1);
  assert.deepEqual(round.savedBanners(), ['vase.blue', 'achievement.angel-1']);
  assert.ok(Object.isFrozen(round.savedBanners()));
  assert.equal(storage.writes(), 1);
  const reload = new AlbumCollection(ids, storage);

  assert.deepEqual(reload.achievementSnapshot(), {
    reconciliations: 1,
    ruined: ['vase'],
    unlocked: ['achievement.angel-1'],
  });
  assert.equal(storage.writes(), 1);
  assert.deepEqual(new RoundAlbum(reload).savedBanners(), []);
});

test('Zerstörung wird über erfolgreiche Runden gesammelt, duplizierte Kontakte und Fehlschläge zählen nicht', () => {
  const storage = memory();
  const collection = new AlbumCollection(ids, storage);

  for (const result of [failed, peaceful]) {
    const round = new RoundAlbum(collection);

    for (let index = 0; index < 7; index++) ruin(round, index);
    round.confirm(result);
    assert.deepEqual(collection.achievementSnapshot(), {
      reconciliations: 0,
      ruined: [],
      unlocked: [],
    });
    assert.deepEqual(round.savedBanners(), []);
  }

  for (let index = 0; index < 7; index++) {
    const round = new RoundAlbum(collection);

    ruin(round, index);
    ruin(round, index);
    round.confirm(success);
    assert.equal(collection.achievementSnapshot().ruined.length, index + 1);
    assert.equal(round.savedBanners().includes('achievement.destruction-v1'), index === 6);
  }

  const repeated = new RoundAlbum(collection);

  ruin(repeated, 0);
  repeated.confirm(success);
  assert.deepEqual(repeated.savedBanners(), []);
  assert.equal(collection.achievementSnapshot().ruined.length, 7);
});

test('Alte Albumversionen bleiben erhalten und erfinden keine historischen Versöhnungen', () => {
  for (const data of [
    { version: 0, unlocked: ['vase.blue'] },
    { version: 1, discovered: ['vase.blue'] },
  ]) {
    const storage = memory(JSON.stringify(data));
    const collection = new AlbumCollection(ids, storage);

    assert.deepEqual(collection.snapshot().discovered, ['vase.blue']);
    assert.equal(collection.achievementSnapshot().reconciliations, 0);
    new RoundAlbum(collection).confirm(success);
    assert.equal(JSON.parse(storage.getItem()!).version, 2);
    assert.equal(new AlbumCollection(ids, storage).achievementSnapshot().reconciliations, 1);
  }
});

test('Katalogfremde Ziele zählen nicht; bekannte Erfolge bleiben bei späteren Katalogänderungen erhalten', () => {
  const storage = memory(
    JSON.stringify({
      version: 2,
      discovered: ['vase.blue'],
      achievements: {
        reconciliations: 100,
        ruined: ['vase', 'future', 'vase'],
        unlocked: [ACHIEVEMENTS[0].id, 'achievement.destruction-v1', 'future'],
      },
    }),
  );
  const collection = new AlbumCollection(ids, storage);

  assert.deepEqual(collection.achievementSnapshot(), {
    reconciliations: 100,
    ruined: ['vase'],
    unlocked: [
      ACHIEVEMENTS[0].id,
      'achievement.destruction-v1',
      ...ACHIEVEMENTS.slice(1, 4).map((entry) => entry.id),
    ],
  });
  new RoundAlbum(collection).confirm(success);
  assert.ok(
    new AlbumCollection(ids, storage)
      .achievementSnapshot()
      .unlocked.includes('achievement.destruction-v1'),
  );
});

test('Fehlerhafte Erfolgsdaten verlieren keine gültigen Albumseiten; neuere Formate bleiben unangetastet', () => {
  for (const achievements of [
    null,
    {},
    { reconciliations: -1 },
    { reconciliations: 1.5 },
    { reconciliations: 12, ruined: [7], unlocked: [] },
  ]) {
    const collection = new AlbumCollection(
      ids,
      memory(JSON.stringify({ version: 2, discovered: ['vase.blue'], achievements })),
    );

    assert.equal(collection.snapshot().storage, 'recovered');
    assert.deepEqual(collection.snapshot().discovered, ['vase.blue']);
    assert.equal(collection.achievementSnapshot().reconciliations, 0);
  }

  const original = JSON.stringify({ version: 3, discovered: ['future'] });
  const storage = memory(original);
  const collection = new AlbumCollection(ids, storage);
  const round = new RoundAlbum(collection);

  round.confirm(success);
  assert.deepEqual(round.savedBanners(), []);
  assert.equal(storage.getItem(), original);
});

test('Opt-in übernimmt gespeicherte und ungespeicherte Runden; Umschalten dupliziert sie nicht; Reset löscht beides', () => {
  const storage = memory(
    JSON.stringify({
      version: 2,
      discovered: ['vase.blue'],
      achievements: { reconciliations: 9, ruined: ['vase'], unlocked: ['achievement.angel-1'] },
    }),
  );
  const collection = new AlbumCollection(ids, storage, false);
  const round = new RoundAlbum(collection);

  round.confirm(success);
  assert.deepEqual(round.savedBanners(), []);
  collection.setRemember(true);
  assert.equal(collection.achievementSnapshot().reconciliations, 10);
  assert.ok(collection.achievementSnapshot().unlocked.includes('achievement.angel-10'));
  collection.setRemember(false);
  new RoundAlbum(collection).confirm(success);
  collection.setRemember(true);
  assert.equal(collection.achievementSnapshot().reconciliations, 11);
  collection.setRemember(false);
  collection.reset();
  const reload = new AlbumCollection(ids, storage);

  assert.deepEqual(reload.snapshot().discovered, []);
  assert.deepEqual(reload.achievementSnapshot(), { reconciliations: 0, ruined: [], unlocked: [] });
});

test('Blockierter Speicher bleibt sitzungsweit benutzbar und kündigt keine dauerhaften Erfolge an', () => {
  const collection = new AlbumCollection(ids, {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota');
    },
  });
  const round = new RoundAlbum(collection);

  round.confirm(success);
  assert.equal(collection.achievementSnapshot().reconciliations, 1);
  assert.deepEqual(collection.achievementSnapshot().unlocked, ['achievement.angel-1']);
  assert.deepEqual(round.savedBanners(), []);
});
