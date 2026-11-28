import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACHIEVEMENTS } from '../../game/play/content/achievements.ts';
import { EMPTY_ACHIEVEMENTS } from '../../game/play/album/achievements.ts';
import { filteredAchievements } from '../../game/play/ui/achievement-filter.ts';

// eslint-disable-next-line max-lines-per-function -- Die vollständige geordnete Partition muss die Sammlung unverändert und ohne Verluste erhalten.
test('Offene und abgeschlossene Erfolge teilen den Katalog verlustfrei und unveränderlich auf', () => {
  const unlocked = Object.freeze(
    ACHIEVEMENTS.filter((_, index) => index % 3 === 0).map((e) => e.id),
  );
  const data = Object.freeze({ ...EMPTY_ACHIEVEMENTS, unlocked });
  const before = JSON.stringify(data);
  const open = filteredAchievements(data, 'open');
  const completed = filteredAchievements(data, 'completed');

  assert.deepEqual(
    completed.map((e) => e.id),
    unlocked,
  );
  assert.equal(open.length + completed.length, ACHIEVEMENTS.length);
  assert.ok(open.every((e) => !unlocked.includes(e.id)));
  assert.deepEqual(filteredAchievements(data, 'all'), ACHIEVEMENTS);
  assert.equal(JSON.stringify(data), before);
});

test('Leere und vollständig freigespielte Sammlungen haben eindeutige Leerzustände', () => {
  assert.equal(filteredAchievements(EMPTY_ACHIEVEMENTS, 'completed').length, 0);
  assert.deepEqual(filteredAchievements(EMPTY_ACHIEVEMENTS, 'open'), ACHIEVEMENTS);
  const data = { ...EMPTY_ACHIEVEMENTS, unlocked: ACHIEVEMENTS.map((e) => e.id) };

  assert.equal(filteredAchievements(data, 'open').length, 0);
  assert.deepEqual(filteredAchievements(data, 'completed'), ACHIEVEMENTS);
});

test('Der Ansichtsfilter leitet keine Freischaltung aus einem Fortschrittszähler ab', () => {
  const data = { ...EMPTY_ACHIEVEMENTS, reconciliations: 100000 };

  assert.equal(filteredAchievements(data, 'completed').length, 0);
  assert.deepEqual(filteredAchievements(data, 'open'), ACHIEVEMENTS);
});
