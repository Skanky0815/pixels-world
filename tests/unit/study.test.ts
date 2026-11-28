/* eslint-disable max-lines-per-function -- Raumroute, Slots, Varianten und eingefrorene Erfolge bilden zusammen den Studienvertrag. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STUDY } from '../../game/play/content/rooms/study.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { populateSpawnSlots } from '../../game/play/content/spawn-slots.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import { difficultyRoom } from '../../game/play/content/difficulty.ts';
import {
  buildPlaygroundRecipe,
  recipeForPlayground,
} from '../../game/play/content/playground-layout.ts';
import { ACHIEVEMENTS } from '../../game/play/content/achievements.ts';
import { discoverAlbum, discoverGoalAlbum } from '../../game/play/content/album/index.ts';
import { chaosEvent } from '../../game/play/domain/chaos-event.ts';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

test('Rechter Einstieg und freie Route über Stuhl/Tisch zur geschützten Fensterbank', () => {
  const room = resolveRoom(STUDY, OBJECTS);

  assert.equal(room.definition.homecomingSide, 'right');
  assert.equal(room.spawn.x, 860);
  assert.equal(room.goal.kind, 'toy');
  assert.equal(room.goal.surfaceY, 222);
  assert.equal(discoverGoalAlbum(room.goal)?.entryId, 'goal.window-toy');
  assert.ok(room.goal.x > 190 + 26 && room.goal.x < 342 - 26);
  const route = ['study-chair', 'study-desk', 'study-windowsill'].map(
    (id) => STUDY.platforms.find((p) => p.id === id)!.bounds,
  );

  assert.ok(468 - route[0].y < 116);
  assert.ok(route[0].y - route[1].y < 116);
  assert.ok(route[1].y - route[2].y < 116);
});

test('Papier, Stifte, Bücher und Bilder werden deterministisch aus den vorhandenen Slots gewählt', () => {
  for (const level of ['easy', 'normal', 'hard'] as const) {
    const room = difficultyRoom(STUDY, level);
    const make = () => populateSpawnSlots(room, OBJECTS, level, () => 0.4);
    const a = make();

    assert.deepEqual(a.objects, make().objects);
    const resolved = resolveRoom(a, OBJECTS);

    assert.equal(resolved.objects.filter((o) => o.variant === 'study-papers').length, 1);
    assert.equal(resolved.objects.filter((o) => o.variant === 'study-pen-cup').length, 1);
    assert.equal(
      resolved.objects.filter((o) => o.kind === 'picture').length,
      level === 'easy' ? 1 : 2,
    );
    assert.ok(
      resolved.objects
        .filter((o) => o.kind === 'picture')
        .every((o) => o.variant.startsWith('study-') && o.variant.endsWith('-poster')),
    );
    const copy = buildPlaygroundRecipe(recipeForPlayground(a));

    assert.deepEqual(copy.objects, a.objects);
    assert.deepEqual(copy.goal, STUDY.goal);
  }
});

test('Neue Funde verlangen echte Schäden und widerrufen keine veröffentlichte Erfolgsfassung', () => {
  assert.equal(
    discoverAlbum(chaosEvent('paper', 'topple', 1, 12), 'study-papers')?.entryId,
    'books.paper',
  );
  assert.equal(
    discoverAlbum(chaosEvent('pens', 'spill', 1, 16), 'study-pen-cup')?.entryId,
    'container.pencils',
  );
  assert.equal(
    discoverAlbum(chaosEvent('poster', 'picture-fall', 1, 18), 'study-space-poster')?.entryId,
    'picture.poster-space',
  );
  assert.deepEqual(ACHIEVEMENTS.find((a) => a.id === 'achievement.rooms-normal-v3')?.targets, [
    'normal/living-room',
    'normal/kitchen',
    'normal/bedroom',
  ]);
  assert.equal(ACHIEVEMENTS.find((a) => a.id === 'achievement.masterpiece-v8')?.threshold, 48);
  assert.ok(
    ACHIEVEMENTS.find((a) => a.id === 'achievement.rooms-normal-v4')?.targets?.includes(
      'normal/study',
    ),
  );
  assert.ok(ACHIEVEMENTS.some((a) => a.id === 'achievement.masterpiece-v9'));
});

test('Finale Gegenstände besitzen feste transparente PNG-Zellen für alle Zustände', () => {
  for (const [name, width, height] of [
    ['paper-stacked', 48, 36],
    ['paper-fallen', 96, 24],
    ['pen-cup', 28, 42],
    ['pen-cup-spilled', 88, 26],
    ['poster-space', 108, 112],
    ['poster-arcade', 108, 112],
  ] as const) {
    const png = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/study/study-${name}.png`, import.meta.url)),
    );

    assert.equal(png.width, width);
    assert.equal(png.height, height);
    assert.ok(png.data.some((v, i) => i % 4 === 3 && v === 0));
    assert.ok(png.data.every((v, i) => i % 4 !== 3 || v === 0 || v === 255));
  }
});

test('Regal-Slots erlauben echte Grünlilien und halten Ziel und Sprungroute frei', () => {
  const room = populateSpawnSlots(difficultyRoom(STUDY, 'hard'), OBJECTS, 'hard', () => 0.4);
  const resolved = resolveRoom(room, OBJECTS);
  const plants = resolved.objects.filter((o) => o.kind === 'plant');

  assert.ok(plants.length > 0);
  assert.ok(plants.every((o) => o.variant === 'bedroom-spiderplant'));
  assert.ok(plants.every((o) => o.kind === 'plant' && o.config.x < 160));
  assert.equal(
    discoverAlbum(chaosEvent('fern', 'nibble', 1, 12), 'bedroom-spiderplant')?.entryId,
    'plant.spiderplant',
  );
  assert.equal(resolved.goal.surfaceY, 222);
});
