import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  CarpetHairball,
  CARPET_RULES,
  carpetEligible,
} from '../../src/game/interactions/carpet-hairball.ts';
import type { InteractionContext } from '../../src/game/interactions/contracts.ts';
import { discoverAlbum } from '../../src/content/album/index.ts';
import { CARPET_ALBUM } from '../../src/content/album/carpet.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { pixelAnimation } from '../../src/game/actors/pixel-animations.ts';

// eslint-disable-next-line max-lines-per-function -- Wartezeit, Würgephase, einmaliger Schaden und Reset bilden den gesamten Ablauf.
test('Teppich wartet, würgt und hinterlässt genau einen Haarballen bis zum Reset', () => {
  const model = new CarpetHairball('rug');

  assert.equal(model.update(CARPET_RULES.delayMs - 1, true), undefined);
  assert.equal(model.snapshot().state, 'waiting');
  model.update(1, true);
  assert.deepEqual(model.snapshot(), { state: 'retching', progress: 0 });
  assert.equal(model.update(CARPET_RULES.retchMs - 1, true), undefined);
  const event = model.update(1, true);

  assert.deepEqual(event, {
    id: '["rug","hairball",1]',
    objectId: 'rug',
    kind: 'hairball',
    stage: 1,
    value: CARPET_RULES.points,
  });

  for (const active of [true, false, true]) assert.equal(model.update(10000, active), undefined);
  assert.deepEqual(model.snapshot(), { state: 'soiled', progress: 1 });
  model.reset();
  assert.deepEqual(model.snapshot(), { state: 'idle', progress: 0 });
  assert.ok(model.update(CARPET_RULES.delayMs + CARPET_RULES.retchMs, true));
});

test('Bewegung unterbricht Anlauf und Würgen vollständig ohne Ereignis', () => {
  for (const elapsed of [1200, CARPET_RULES.delayMs + 700]) {
    const model = new CarpetHairball('rug');

    model.update(elapsed, true);
    assert.equal(model.update(0, false), undefined);
    assert.deepEqual(model.snapshot(), { state: 'idle', progress: 0 });
    assert.equal(model.update(CARPET_RULES.delayMs + CARPET_RULES.retchMs - 1, true), undefined);
    assert.ok(model.update(1, true));
  }
});

// eslint-disable-next-line max-lines-per-function -- Konfigurationsfehler und ungültige Deltas dürfen den selben Zeitvertrag nicht umgehen.
test('Ungültige Zeitwerte/Punkte scheitern; nicht endliche oder negative Deltas beschleunigen nichts', () => {
  for (const rules of [
    { ...CARPET_RULES, delayMs: 0 },
    { ...CARPET_RULES, retchMs: Infinity },
    { ...CARPET_RULES, points: -1 },
  ])
    assert.throws(() => new CarpetHairball('rug', rules));
  assert.throws(() => new CarpetHairball(''));
  const model = new CarpetHairball('rug');

  for (const delta of [-500, NaN, Infinity]) model.update(delta, true);
  assert.deepEqual(model.snapshot(), { state: 'waiting', progress: 0 });
});

// eslint-disable-next-line max-lines-per-function -- Der reine Kontaktvertrag deckt Raumzone, Bodenhöhe, Bewegung, Sprung und Klettern ab.
function context(x = 520): InteractionContext {
  return {
    time: 0,
    delta: 16,
    input: {
      active: false,
      horizontal: 0,
      vertical: 0,
      jumpPressed: false,
      resetPressed: false,
      confirmPressed: false,
      arrows: [],
    },
    pixel: {
      x,
      y: 436,
      bottom: 468,
      left: x - 26,
      top: 416,
      bodyWidth: 52,
      bodyHeight: 52,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      climbing: false,
      animationFrame: 0,
    },
  };
}

// eslint-disable-next-line max-lines-per-function -- Nur stehender Bodenkontakt innerhalb der sichtbaren Teppichbreite ist zulässig.
test('Außerhalb des Teppichs, auf dem Sofa, beim Laufen oder Springen wird nichts ausgelöst', () => {
  const area = { x: 245, y: 466, width: 430, height: 30 };

  assert.ok(carpetEligible(context(), area, 468));

  for (const x of [110, 244, 676, 800]) assert.equal(carpetEligible(context(x), area, 468), false);
  const base = context();

  for (const patch of [
    { bottom: 370 },
    { grounded: false },
    { velocityX: 100 },
    { velocityY: -400 },
    { climbing: true },
  ])
    assert.equal(carpetEligible({ ...base, pixel: { ...base.pixel, ...patch } }, area, 468), false);
  assert.equal(
    carpetEligible({ ...base, input: { ...base.input, active: true } }, area, 468),
    false,
  );
});

// eslint-disable-next-line max-lines-per-function -- Der Albumvertrag reagiert ausschließlich auf den tatsächlichen Haarballen und bleibt über Runden stabil.
test('Albumdaten haben DE/EN, ein echtes PNG und stabile Fund-IDs ohne zweiten Speicher', () => {
  const entry = CARPET_ALBUM['living-room-rug'];

  for (const language of ['de', 'en'] as const)
    assert.ok(entry.fluff[language] && entry.sara[language]);
  const event = chaosEvent('rug', 'hairball', 1, CARPET_RULES.points);

  assert.equal(discoverAlbum(event, 'living-room-rug')?.entryId, entry.id);
  assert.equal(
    discoverAlbum(chaosEvent('other-rug', 'hairball', 1, 15), 'living-room-rug')?.entryId,
    entry.id,
  );
  assert.equal(discoverAlbum(chaosEvent('rug', 'nibble', 1, 2), 'living-room-rug'), null);
  assert.equal(discoverAlbum(event, 'pixel-portrait'), null);
  assert.equal(discoverAlbum(event, 'unknown'), null);
  const png = PNG.sync.read(
    readFileSync(new URL('../../assets/objects/carpet/hairball.png', import.meta.url)),
  );

  assert.deepEqual([png.width, png.height], [32, 16]);
  const alpha = [...png.data].filter((_, i) => i % 4 === 3);

  assert.equal(alpha[0], 0);
  assert.ok(alpha.some((a) => a >= 250));
});

// eslint-disable-next-line max-lines-per-function -- Die neue Pose hat einen eigenen Ablauf und bleibt der Bewegungspriorität untergeordnet.
test('Eigene Würgeanimation verwendet die geduckte Pose, ohne Sprung oder Klettern zu übersteuern', () => {
  const state = {
    climbing: false,
    sliding: false,
    grounded: true,
    velocityX: 0,
    velocityY: 0,
    scratching: false,
    nibbling: false,
    retching: true,
    landing: false,
  };

  assert.equal(pixelAnimation(state), 'retch');
  assert.equal(pixelAnimation({ ...state, grounded: false, velocityY: -400 }), 'jump');
  assert.equal(pixelAnimation({ ...state, climbing: true }), 'climb');
});
