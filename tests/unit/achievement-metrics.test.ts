/* eslint-disable max-lines-per-function -- Rohwerte, Anzeigegrenzen und Freischaltung werden als zusammenhängende Vertragsfälle verglichen. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { achievementValue, achievementTargets } from '../../game/play/album/achievement-metrics.ts';
import {
  AchievementProgress,
  EMPTY_ACHIEVEMENTS,
  type AchievementData,
} from '../../game/play/album/achievements.ts';
import { ACHIEVEMENTS, DESTRUCTION_TARGETS } from '../../game/play/content/achievements.ts';
import { DESTRUCTION_VARIANTS } from '../../game/play/content/achievement-categories.ts';
import { ROOM_COMPLETIONS } from '../../game/play/content/achievement-rooms.ts';
import { achievementCount, achievementsMarkup } from '../../game/play/ui/achievement-markup.ts';

const fields = {
  destruction: 'ruined',
  variants: 'ruinedVariants',
  rooms: 'completedRooms',
  all: 'unlocked',
} as const;

function asSets(data: AchievementData) {
  return {
    ...data,
    ruined: new Set(data.ruined),
    ruinedVariants: new Set(data.ruinedVariants ?? []),
    completedRooms: new Set(data.completedRooms ?? []),
    unlocked: new Set(data.unlocked),
  };
}

for (const metric of ['reconciliations', 'destruction', 'variants', 'rooms', 'all'] as const)
  test(`${metric}: Rohwert und Anzeige unter, an und über der Schwelle; Arrays und Mengen stimmen überein`, () => {
    const entry = {
      ...ACHIEVEMENTS[0],
      metric,
      threshold: 2,
      targets: metric === 'reconciliations' ? undefined : ['first', 'second', 'third'],
    };

    for (const amount of [1, 2, 3]) {
      const data: AchievementData = Object.freeze({
        reconciliations: metric === 'reconciliations' ? amount : 99,
        ruined: Object.freeze(['unrelated']),
        ruinedVariants: Object.freeze(['unrelated']),
        completedRooms: Object.freeze(['unrelated']),
        unlocked: Object.freeze(['unrelated']),
        ...(metric === 'reconciliations'
          ? {}
          : {
              [fields[metric]]: Object.freeze(['unrelated', ...entry.targets!.slice(0, amount)]),
            }),
      });
      const before = structuredClone(data);

      assert.equal(achievementValue(entry, data), amount);
      assert.equal(achievementValue(entry, asSets(data)), amount);
      assert.equal(achievementCount(entry, data), amount === 1 ? 1 : 2);
      assert.deepEqual(data, before, 'Die reine Auswertung verändert keinen Fortschritt');
    }
  });

test('Historische Zielmengen bleiben fest; Zähler ohne Zielmenge liefern den ungekappten Rohwert', () => {
  const entry = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.destruction-v1')!;
  const data = { ...EMPTY_ACHIEVEMENTS, ruined: DESTRUCTION_TARGETS.map((target) => target.id) };

  assert.equal(achievementValue(entry, data), 7);
  assert.equal(achievementValue({ ...entry, targets: undefined }, data), 15);
  assert.equal(achievementCount({ ...entry, targets: undefined }, data), 7);
  assert.equal(achievementCount(entry, data), 7);
  assert.equal(achievementValue({ ...entry, targets: ['vase', 'couch'] }, data), 2);
});

test('Alte Spielstände ohne Varianten-/Raumfelder erfinden keine Ziele und verlieren keine Freischaltung', () => {
  const legacy: AchievementData = {
    reconciliations: 10,
    ruined: ['vase'],
    unlocked: ['achievement.destruction-v1'],
  };
  const progress = new AchievementProgress();

  progress.restore(legacy);
  assert.ok(progress.snapshot().unlocked.includes('achievement.destruction-v1'));

  for (const metric of ['variants', 'rooms'] as const) {
    const entry = { ...ACHIEVEMENTS[0], metric, targets: ['vase'], threshold: 1 };

    assert.equal(achievementValue(entry, legacy), 0);
    assert.equal(achievementCount(entry, legacy), 0);
    assert.equal(achievementTargets(metric, legacy).size, 0);
  }
});

test('Alle Katalogfassungen zeigen dieselbe Schwelle wie die tatsächliche Freischaltung', () => {
  for (const count of [0, 1, 3, 4, 6, 7, 9, 10, 49, 50, 99, 100, 101]) {
    const progress = new AchievementProgress();

    progress.restore({
      reconciliations: count,
      ruined: DESTRUCTION_TARGETS.slice(0, count).map((target) => target.id),
      ruinedVariants: DESTRUCTION_VARIANTS.slice(0, count),
      completedRooms: ROOM_COMPLETIONS.slice(0, count),
      unlocked: [],
    });
    const data = progress.snapshot();

    for (const entry of ACHIEVEMENTS) {
      const displayed = achievementCount(entry, data);

      assert.equal(displayed >= entry.threshold, data.unlocked.includes(entry.id), entry.id);
      assert.ok(displayed <= entry.threshold);
    }
  }
});

test('Gerenderte Zielhäkchen und Fortschrittsbalken verwenden für jede Zielmetrik dieselbe Menge', () => {
  for (const metric of ['destruction', 'variants', 'rooms', 'all'] as const) {
    const entry = ACHIEVEMENTS.find((entry) => entry.metric === metric && entry.targets)!;
    const data: AchievementData = {
      ...EMPTY_ACHIEVEMENTS,
      unlocked: [entry.id],
      [fields[metric]]: [entry.targets![0], 'unrelated', ...(metric === 'all' ? [entry.id] : [])],
    };
    const markup = achievementsMarkup(data, entry.id);
    const list = markup.match(/<ul class="achievement-targets"[^>]*>(.*?)<\/ul>/s)![1];

    assert.equal(achievementCount(entry, data), 1);
    assert.equal((list.match(/>✓<\/span>/g) ?? []).length, 1);
    assert.equal((list.match(/>○<\/span>/g) ?? []).length, entry.targets!.length - 1);
    assert.match(markup, /<progress[^>]+value="1"/);
  }
});
