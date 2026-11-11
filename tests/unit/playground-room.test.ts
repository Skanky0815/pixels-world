import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playgroundRoom, PLAYGROUND_OBJECTS } from '../../src/dev/playground-room.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';

// eslint-disable-next-line max-lines-per-function -- Jede echte Variante wird über denselben Resolver auf Platzierung und Isolation geprüft.
test('Playground löst alle Katalogvarianten mit genau einem realen Objekt auf', () => {
  const original = JSON.stringify(LIVING_ROOM);

  for (const [variant, definition] of Object.entries(PLAYGROUND_OBJECTS)) {
    const room = playgroundRoom(variant);

    assert.equal(room.objects.length, 1);
    assert.equal(room.objects[0].kind, definition.kind);
    assert.equal(room.objects[0].variant, variant);
    assert.equal(room.spawn.bottom, definition.capabilities.includes('push') ? 330 : 468);
  }

  assert.equal(JSON.stringify(LIVING_ROOM), original);
});

test('Neue registrierte Variante braucht keine eigene Playground-Implementierung', () => {
  const catalog = { ...PLAYGROUND_OBJECTS, 'test-grass': PLAYGROUND_OBJECTS.catgrass };

  assert.equal(playgroundRoom('test-grass', catalog).objects[0].variant, 'test-grass');
  assert.throws(() => playgroundRoom('missing'), /Unknown playground variant/);
  assert.throws(() => playgroundRoom('toString'), /Unknown playground variant/);
});

// eslint-disable-next-line max-lines-per-function -- Gemeinsame Bruchphysik bleibt im Browser; die vollständige Variantenmatrix schützt die real aufgelösten Werte und Grafiken.
test('Alle Vasenvarianten erhalten ihren eigenen Wert und ihre Grafik bei gleicher Auflage', () => {
  for (const [variant, appearance, points] of [
    ['small-vase', 'terracotta', 25],
    ['blue-vase', 'blue', 35],
    ['heirloom-vase', 'gold', 40],
    ['mellow-vase', 'mellow', 15],
  ] as const) {
    const object = playgroundRoom(variant).objects[0];

    assert.ok(object.kind === 'vase');
    assert.equal(object.config.appearance, appearance);
    assert.equal(object.config.points, points);
    assert.equal(object.config.shelfY, 330);
    assert.equal(object.config.floorY, 468);
  }
});
