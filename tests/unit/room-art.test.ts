import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PNG } from 'pngjs';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { populateSpawnSlots } from '../../src/game/content/spawn-slots.ts';
import type { RoomDefinition } from '../../src/game/content/definitions.ts';

const dimensions = {
  plaster: [64, 64],
  panel: [48, 64],
  floor: [48, 12],
  ceiling: [48, 7],
  picture: [54, 56],
  window: [56, 92],
  door: [56, 108],
  rug: [215, 15],
};

// eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
test('Raumset besitzt kleine wiederverwendbare Module und echte Transparenz für Fenster, Tür und Teppich', () => {
  for (const [key, size] of Object.entries(dimensions)) {
    const image = PNG.sync.read(
      readFileSync(
        new URL(`../../assets/environment/living-room/room-${key}.png`, import.meta.url),
      ),
    );

    assert.deepEqual([image.width, image.height], size);
    const alpha = image.data.filter((_, i) => i % 4 === 3);

    assert.ok(alpha.some((a) => a >= 192));

    if (['window', 'door', 'rug'].includes(key)) assert.ok(alpha.some((a) => a === 0));
  }
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
test('Beide Räume verwenden getrennte Kulissenelemente ohne Bücher und gültige Bildgrenzen', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    assert.equal(room.environment, 'cozy-room');
    assert.deepEqual(
      room.decorations.map((d) => d.kind === 'image' && d.asset),
      ['room-window', 'room-picture', 'room-rug', 'room-door'],
    );
    assert.doesNotThrow(() => resolveRoom(room, OBJECTS));
    assert.throws(
      () => resolveRoom({ ...room, environment: 'missing' } as unknown as RoomDefinition, OBJECTS),
      /unknown environment/,
    );
    assert.throws(
      // eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
      () =>
        resolveRoom(
          {
            ...room,
            decorations: [
              {
                kind: 'image',
                asset: 'vase-default',
                bounds: { x: 1, y: 1, width: 20, height: 20 },
              },
            ],
          } as unknown as RoomDefinition,
          OBJECTS,
        ),
      /incompatible asset/,
    );
  }
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
test('Mittlere Slotvase folgt ihrem Regalanker statt einer separaten Weltposition', () => {
  // eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
  const create = (delta: number) =>
    populateSpawnSlots(
      {
        ...LIVING_ROOM,
        platforms: LIVING_ROOM.platforms.map((p) =>
          p.id === 'middle-shelf' ? { ...p, bounds: { ...p.bounds, x: p.bounds.x + delta } } : p,
        ),
      },
      OBJECTS,
      'normal',
      () => 0.5,
    );
  const before = create(0).objects.find((o) => o.id === 'middle-shelf:middle-slot');
  const after = create(-24).objects.find((o) => o.id === 'middle-shelf:middle-slot');

  assert.ok(before && after);
  assert.equal(after.variant, before.variant);
  assert.equal(after.placement.x - before.placement.x, -24);
  assert.equal(before.placement.mode, 'surface');
});
