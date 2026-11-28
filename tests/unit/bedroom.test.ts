/* eslint-disable max-lines-per-function -- Zustandsgrenzen und versionierte Fortschrittsverträge bleiben als vollständige Gegenproben lesbar. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LaundryMotion, LAUNDRY_RULES } from '../../game/play/interactions/laundry.ts';
import { GoalRest, GOAL_REST_DURATION } from '../../game/play/domain/goal-rest.ts';
import { MainGoal } from '../../game/play/domain/main-goal.ts';
import { BEDROOM } from '../../game/play/content/rooms/bedroom.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import { playableRoom } from '../../game/play/content/rooms/selection.ts';
import { ACHIEVEMENTS, destructionTarget } from '../../game/play/content/achievements.ts';
import { AchievementProgress } from '../../game/play/album/achievements.ts';
import { chaosEvent } from '../../game/play/domain/chaos-event.ts';

test('Wäsche: Ruhe, Abbruch, zwei neue Zustände, Fremdstoß und Reset teilen deduplizierte Ereignisse', () => {
  const motion = new LaundryMotion('pile');

  assert.equal(motion.advance(99999, false), undefined);
  assert.equal(motion.advance(200, true), undefined);
  motion.advance(10, false);
  assert.equal(motion.snapshot().progress, 0);
  assert.equal(motion.advance(LAUNDRY_RULES.warningMs, true)?.stage, 1);
  motion.advance(10, false);
  assert.equal(motion.snapshot().stage, 1);
  motion.knockOver();
  assert.equal(motion.advance(LAUNDRY_RULES.fallMs, false)?.stage, 2);
  assert.equal(motion.advance(99999, true), undefined);
  assert.equal(motion.knockOver(), false);
  motion.reset();
  assert.deepEqual(motion.snapshot(), { stage: 0, progress: 0, forced: false });

  for (const delta of [0, -1, NaN, Infinity]) motion.advance(delta, true);
  assert.equal(motion.snapshot().progress, 0);
});

test('Wäschemodell weist ungültige Zeit- und Punkteverträge zurück', () => {
  for (const patch of [{ warningMs: 0 }, { fallMs: Infinity }, { points: -1 }, { points: 0.5 }])
    assert.throws(() => new LaundryMotion('pile', { ...LAUNDRY_RULES, ...patch }), /Invalid/);
});

test('Schlafziel: Boden unter dem Bett und Stillstand erforderlich, eigene pausierbare Ruheaktion', () => {
  const room = resolveRoom(BEDROOM, OBJECTS);
  const goal = new MainGoal(room.goal);
  const contact = {
    x: 470,
    left: 444,
    bodyWidth: 52,
    bottom: 468,
    grounded: true,
    climbing: false,
    velocityX: 0,
  };

  assert.equal(playableRoom('bedroom')?.id, 'bedroom');
  assert.equal(room.goal.surfaceY, BEDROOM.floor.y);
  assert.ok(room.goal.x > 340 && room.goal.x < 620);
  assert.ok(room.goal.dwellMs < OBJECTS['bedroom-runner'].rules.delayMs);
  assert.equal(room.objects.find((object) => object.kind === 'lamp')?.config.id, 'bedside-lamp');
  assert.equal(goal.advance(2000, { ...contact, bottom: 340 }, false), false);
  assert.equal(goal.advance(1599, contact, false), false);
  assert.equal(goal.advance(1, contact, false), true);
  const rest = new GoalRest();

  rest.start();
  assert.equal(rest.pose().frame, 6);
  assert.equal(rest.pose().sheet, 'charm');
  assert.equal(rest.pose().x, 0);
  rest.advance(500);
  const paused = rest.snapshot();

  for (const delta of [0, -1, NaN, Infinity]) rest.advance(delta);
  assert.deepEqual(rest.snapshot(), paused);
  assert.equal(rest.advance(GOAL_REST_DURATION - 500), true);
  assert.equal(rest.advance(100), false);
  assert.ok(rest.pose().frame >= 8 && rest.pose().frame <= 11);
  assert.equal(rest.pose(true).frame, 8);
});

test('Schlafzimmer erweitert nur neue Erfolgsfassungen; Teilwäsche zählt nicht als vollständig ruiniert', () => {
  const oldRooms = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.rooms-normal-v2');
  const newRooms = ACHIEVEMENTS.find((entry) => entry.id === 'achievement.rooms-normal-v3');

  assert.deepEqual(oldRooms?.targets, ['normal/living-room', 'normal/kitchen']);
  assert.deepEqual(newRooms?.targets, ['normal/living-room', 'normal/kitchen', 'normal/bedroom']);
  assert.equal(destructionTarget(chaosEvent('pile', 'spill', 1, 10), 'laundry'), undefined);
  assert.equal(destructionTarget(chaosEvent('pile', 'spill', 2, 10), 'laundry'), 'laundry');
  const progress = new AchievementProgress();

  progress.restore({ reconciliations: 0, ruined: [], unlocked: ['achievement.rooms-normal-v2'] });
  progress.confirm(false, [], [], ['hard/bedroom', 'hard-peaceful/bedroom']);
  assert.ok(progress.snapshot().unlocked.includes('achievement.rooms-normal-v2'));
  assert.ok(progress.snapshot().unlocked.includes('achievement.peaceful-bedroom-v1'));
  assert.ok(!progress.snapshot().unlocked.includes('achievement.rooms-hard-v3'));
});
