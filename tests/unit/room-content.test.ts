import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { selectRoom } from '../../src/content/rooms/index.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { ObjectCatalog, RoomDefinition } from '../../src/game/content/definitions.ts';

const bad = (room: unknown, catalog: unknown = OBJECTS) =>
  resolveRoom(room as RoomDefinition, catalog as ObjectCatalog);

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Standardcontent erhält Raum, Spawn, Sofageometrie und Vasenscoring des Prototyps', () => {
  const before = JSON.stringify(LIVING_ROOM);
  const room = resolveRoom(LIVING_ROOM, OBJECTS);

  assert.deepEqual(room.spawn, { x: 110, bottom: 468 });
  assert.equal(room.definition.width, 960);
  assert.equal(room.definition.height, 540);
  assert.equal(room.objects.length, 6);
  const couch = room.objects.find((object) => object.kind === 'couch');

  assert.ok(couch);
  assert.deepEqual(couch.config.seat, { x: 180, y: 370, width: 254, height: 28 });
  assert.equal(couch.config.reach, 20);
  assert.deepEqual(
    room.objects
      .filter((object) => object.kind === 'vase')
      .map((object) => [object.id, object.config.x, object.config.shelfY, object.config.points]),
    [
      ['small-vase', 620, 304, 25],
      ['blue-vase', 710, 224, 35],
      ['heirloom-vase', 906, 154, 40],
    ],
  );
  assert.equal(JSON.stringify(LIVING_ROOM), before, 'Resolver darf Quelldaten nicht ändern');
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Zweite handgebaute Variante ändert Platzierungen/Werte und verwendet dieselbe Vorlage zweimal', () => {
  const room = resolveRoom(COZY_REMIX, OBJECTS);
  const couches = room.objects.filter((object) => object.kind === 'couch');

  assert.equal(couches.length, 2);
  assert.deepEqual(
    couches.map((object) => [
      object.id,
      object.variant,
      object.config.seat.x,
      object.config.rules.damageValue,
    ]),
    [
      ['couch', 'worn-couch', 200, 1],
      ['reading-couch', 'worn-couch', 480, 1],
    ],
  );
  assert.equal(new Set(room.objects.map((object) => object.id)).size, room.objects.length);
  assert.equal(resolveRoom(LIVING_ROOM, OBJECTS).objects[0]?.variant, 'cozy-couch');
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Auflagehöhen folgen referenzierten Flächen einschließlich eines Sofas', () => {
  const room = resolveRoom(
    {
      ...LIVING_ROOM,
      objects: LIVING_ROOM.objects.map((object) =>
        object.id === 'small-vase'
          ? { ...object, placement: { mode: 'surface', x: 300, surfaceId: 'couch' } }
          : object,
      ),
    },
    OBJECTS,
  );
  const vase = room.objects.find((object) => object.id === 'small-vase');

  assert.equal(vase?.kind, 'vase');
  assert.ok(vase?.kind === 'vase');
  assert.equal(vase.config.shelfY, 370);
});

test('Doppelte Instanz-/Flächen-IDs werden vor dem Szenenaufbau zurückgewiesen', () => {
  assert.throws(
    () => bad({ ...LIVING_ROOM, objects: [...LIVING_ROOM.objects, LIVING_ROOM.objects[0]] }),
    /duplicate ID couch/,
  );
  assert.throws(
    () => bad({ ...LIVING_ROOM, objects: [{ ...LIVING_ROOM.objects[0], id: 'floor' }] }),
    /duplicate ID floor/,
  );
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Unbekannte Varianten, Asset-Schlüssel und unpassende Fähigkeiten nennen den Datenpfad', () => {
  assert.throws(
    () => bad({ ...LIVING_ROOM, objects: [{ ...LIVING_ROOM.objects[0], variant: 'toString' }] }),
    /objects.couch.variant/,
  );
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], asset: 'missing' },
      }),
    /objects.cozy-couch.asset/,
  );
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], asset: 'vase-default' },
      }),
    /incompatible asset/,
  );
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], capabilities: ['damage'] },
      }),
    /capabilities/,
  );
  assert.throws(() => bad({ ...LIVING_ROOM, pixelAsset: 'missing' }), /pixelAsset/);
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Fehlende und zyklische Flächenreferenzen scheitern mit verständlichem Pfad', () => {
  assert.throws(
    () => bad({ ...LIVING_ROOM, spawn: { x: 110, surfaceId: 'missing' } }),
    /spawn.surfaceId/,
  );
  const objects = LIVING_ROOM.objects.map((object) =>
    object.id === 'couch'
      ? { ...object, placement: { mode: 'surface', x: 180, surfaceId: 'couch' } }
      : object,
  );

  assert.throws(() => bad({ ...LIVING_ROOM, objects }), /cyclic surface reference/);
  assert.throws(
    () =>
      bad({
        ...LIVING_ROOM,
        objects: [
          { ...LIVING_ROOM.objects[0], placement: { mode: 'surface', x: 180, surfaceId: 'plant' } },
        ],
      }),
    /unknown support surface/,
  );
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Ungültige Geometrie, Auflagen und Spawns erreichen keinen Objektkonstruktor', () => {
  assert.throws(
    () => bad({ ...LIVING_ROOM, floor: { ...LIVING_ROOM.floor, y: Infinity } }),
    /floor.y/,
  );
  assert.throws(() => bad({ ...LIVING_ROOM, spawn: { x: 0, surfaceId: 'floor' } }), /spawn/);
  assert.throws(
    () =>
      bad({
        ...LIVING_ROOM,
        platforms: [
          { ...LIVING_ROOM.platforms[0], bounds: { x: 950, y: 300, width: 80, height: 16 } },
        ],
      }),
    /outside room/,
  );
  assert.throws(
    () =>
      bad({
        ...LIVING_ROOM,
        objects: [
          {
            ...LIVING_ROOM.objects[3],
            placement: { mode: 'surface', x: 500, surfaceId: 'lower-shelf' },
          },
        ],
      }),
    /support surface/,
  );
  assert.throws(
    () =>
      bad({
        ...LIVING_ROOM,
        objects: [{ ...LIVING_ROOM.objects[1], placement: { mode: 'area', x: 950, y: 112 } }],
      }),
    /outside room/,
  );
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Werte/Zeiten/Farben und fehlende Strukturen werden semantisch geprüft', () => {
  for (const damageValue of [-1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () =>
        bad(LIVING_ROOM, {
          ...OBJECTS,
          'cozy-couch': {
            ...OBJECTS['cozy-couch'],
            rules: { ...OBJECTS['cozy-couch'].rules, damageValue },
          },
        }),
      /damageValue/,
    );
  }

  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': {
          ...OBJECTS['cozy-couch'],
          rules: { ...OBJECTS['cozy-couch'].rules, damageIntervalMs: 0 },
        },
      }),
    /damageIntervalMs/,
  );
  assert.throws(
    () => bad({ ...LIVING_ROOM, floor: { ...LIVING_ROOM.floor, plankWidth: 0 } }),
    /plankWidth/,
  );
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'small-vase': { ...OBJECTS['small-vase'], color: 0x1000000 },
      }),
    /color/,
  );
  assert.throws(() => bad({ ...LIVING_ROOM, platforms: undefined }), /platforms.*array/);
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], rules: undefined },
      }),
    /rules.*object/,
  );
});

test('Sichere Einzelwerte dürfen gemeinsam keine unsichere Gesamtpunktzahl ergeben', () => {
  assert.throws(
    () =>
      bad(LIVING_ROOM, {
        ...OBJECTS,
        'small-vase': { ...OBJECTS['small-vase'], points: Number.MAX_SAFE_INTEGER },
      }),
    /maximum score/,
  );
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Leere Räume sind gültig; Variantenwahl ist im Produktionsmodus deaktiviert', () => {
  assert.equal(
    resolveRoom(
      {
        ...LIVING_ROOM,
        goal: { ...LIVING_ROOM.goal, surfaceId: 'floor', x: 500 },
        objects: [],
        platforms: [],
        decorations: [],
      },
      OBJECTS,
    ).objects.length,
    0,
  );
  assert.strictEqual(selectRoom('cozy-remix', true), COZY_REMIX);
  assert.strictEqual(selectRoom('cozy-remix', false), LIVING_ROOM);
  assert.strictEqual(selectRoom(null, true), LIVING_ROOM);
  assert.throws(() => selectRoom('constructor', true), /Unknown room/);
});
