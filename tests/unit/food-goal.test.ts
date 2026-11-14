/* eslint-disable max-lines-per-function -- Reale Raumdaten prüfen Kontakt, Schutz vor falscher Belegung und friedliche Entdeckung. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KITCHEN_PREVIEW } from '../../src/content/rooms/kitchen-preview.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { RoomDefinition } from '../../src/game/content/definitions.ts';
import { MainGoal } from '../../src/game/domain/main-goal.ts';
import { discoverGoalAlbum, discoverAlbum, albumEntries } from '../../src/content/album/index.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';

const definition = resolveRoom(KITCHEN_PREVIEW, OBJECTS).goal;

test('Napf nutzt denselben stillen Zielkontakt und bleibt bei verpasster Runde unerfüllt', () => {
  const model = new MainGoal(definition);
  const contact = {
    x: 835,
    left: 815,
    bodyWidth: 52,
    bottom: 258,
    grounded: true,
    climbing: false,
    velocityX: 0,
  };

  assert.equal(definition.kind, 'food');
  assert.equal(definition.area.width, 36);
  assert.equal(model.advance(1200, { ...contact, bottom: 468 }, false), false);
  assert.equal(model.advance(1200, contact, true), false);
  assert.equal(model.advance(1200, contact, false), true);
  model.finish('goal');
  assert.equal(model.snapshot().status, 'reached');
  const missed = new MainGoal(definition);

  missed.finish('timer');
  assert.equal(missed.advance(1200, contact, false), false);
  assert.equal(missed.snapshot().status, 'missed');
});

test('Futterziel lehnt Zufallsbelegung, falsche Kategorie, ungültiges Album und unpassende Auflage ab', () => {
  for (const change of [
    { spawn: { ...definition.spawn, random: true, support: 'any-surface' } },
    { spawn: { ...definition.spawn, category: 'toy' } },
    { albumVariant: 'unknown' },
    { kind: 'unknown' },
    { x: 950 },
  ]) {
    const room = {
      ...KITCHEN_PREVIEW,
      goal: { ...KITCHEN_PREVIEW.goal, ...change },
    } as unknown as RoomDefinition;

    assert.throws(() => resolveRoom(room, OBJECTS), /goal/);
  }
});

test('Napffund ist ein eigenes friedliches Albumereignis; Schäden und öffentliche Zerstörungsziele bleiben getrennt', () => {
  const found = discoverGoalAlbum(definition);

  assert.equal(found?.entryId, 'goal.food-bowl');
  assert.deepEqual(found, discoverGoalAlbum(definition));
  assert.equal(discoverAlbum(chaosEvent(definition.id, 'break', 1, 25), 'food-bowl'), null);
  assert.equal(discoverGoalAlbum({ ...definition, albumVariant: undefined }), null);
  assert.equal(
    albumEntries(false).some((e) => e.id === found?.entryId),
    true,
  );
  assert.equal(
    albumEntries(true).some((e) => e.id === found?.entryId),
    true,
  );
});
