/* eslint-disable max-lines-per-function -- Vollständige Beutelzustände, Speichertransaktionen und veröffentlichte Kataloggrenzen werden gemeinsam geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { Toppling, FOOD_BAG_RULES } from '../../src/game/interactions/toppling.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { discoverAlbum, albumEntries } from '../../src/content/album/index.ts';
import {
  DESTRUCTION_TARGETS,
  ACHIEVEMENTS,
  destructionTarget,
} from '../../src/content/achievements.ts';
import { DESTRUCTION_VARIANTS } from '../../src/content/achievement-categories.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import type { RoundResult } from '../../src/game/domain/round-result.ts';
import { ReactionDamage } from '../../src/game/domain/reaction-damage.ts';

const bag = () => new Toppling('bag', FOOD_BAG_RULES, 'spill', 'upright');
const result: RoundResult = {
  score: 18,
  goalReached: true,
  reaction: 'Entspannt',
  dialogue: '',
  difficulty: 'normal',
  closingLine: '',
  outcome: 'success',
  hearts: 1,
  required: 1,
  peaceful: false,
};

test('Beutel warnt, kurzer Kontakt bleibt ohne Schaden und Weggehen setzt zurück', () => {
  const model = bag();

  model.update(FOOD_BAG_RULES.warningMs - 1, true);
  assert.equal(model.snapshot().state, 'wobbling');
  model.update(1, false);
  assert.deepEqual(model.snapshot(), { state: 'upright', progress: 0 });
  assert.equal(model.update(699, true), undefined);
  assert.equal(model.update(1, true), undefined);
  assert.equal(model.snapshot().state, 'falling');
});

test('Starker Fremdstoß ist unumkehrbar und verschüttet genau einmal; Reset erlaubt einen neuen Schaden', () => {
  const model = bag();
  const score = new ChaosScore();

  assert.equal(model.knockOver(), true);
  assert.equal(model.knockOver(), false);
  assert.equal(model.update(499, false), undefined);
  const event = model.update(1, false);

  assert.equal(event?.kind, 'spill');
  assert.ok(event);
  score.awardEvent(event);
  score.awardEvent(event);
  assert.equal(score.score, 18);
  assert.equal(model.update(10000, true), undefined);
  assert.equal(model.knockOver(), false);
  model.reset();
  assert.equal(model.knockOver(), true);
  assert.equal(model.update(500, false)?.kind, 'spill');
});

test('Auflagenverlust und ungültige Zeit erzeugen keine zusätzlichen Ereignisse', () => {
  const model = bag();

  for (const delta of [0, -1, NaN, Infinity]) model.update(delta, true);
  assert.equal(model.snapshot().progress, 0);
  model.releaseSupport();
  assert.equal(model.update(500, false)?.value, 18);
  model.releaseSupport();
  assert.equal(model.update(500, false), undefined);
});

test('Spillfund, konkrete Sara-Reaktion und gemeinsame Erfolgsbestätigung bleiben getrennt vom Napf', () => {
  const event = chaosEvent('bag', 'spill', 1, 18);
  const discovery = discoverAlbum(event, 'dry-food-bag');

  assert.equal(discovery?.entryId, 'food-bag.dry');
  assert.equal(discoverAlbum(chaosEvent('bag', 'topple', 1, 18), 'dry-food-bag'), null);
  const reaction = new ReactionDamage();

  reaction.record(event, 'food-bag');
  assert.equal(reaction.snapshot()?.topic, 'foodBag');

  for (const outcome of ['success', 'failed'] as const) {
    const collection = new AlbumCollection(new Set(['food-bag.dry']), undefined, false);
    const round = new RoundAlbum(collection);

    assert.equal(round.record(discovery!.entryId), true);
    round.recordDamage(event, 'food-bag', 'food-bag.dry');
    round.confirm({ ...result, outcome }, 'kitchen-preview');
    assert.deepEqual(
      collection.snapshot().discovered,
      outcome === 'success' ? ['food-bag.dry'] : [],
    );
    assert.equal(
      round.confirmedBanners().filter((id) => id === 'food-bag.dry').length,
      outcome === 'success' ? 1 : 0,
    );
    assert.deepEqual(round.savedDiscoveries(), []);
  }
});

test('Unveröffentlichter Beutel ändert weder eingefrorene Erfolgsziele noch die veröffentlichte Sammlung', () => {
  assert.equal(
    albumEntries(false).some((entry) => entry.id === 'food-bag.dry'),
    false,
  );
  assert.equal(
    albumEntries(true).some((entry) => entry.id === 'food-bag.dry'),
    true,
  );
  assert.equal(destructionTarget(chaosEvent('bag', 'spill', 1, 18), 'food-bag'), undefined);
  assert.equal(DESTRUCTION_TARGETS.length, 7);
  assert.equal(DESTRUCTION_VARIANTS.includes('food-bag.dry'), false);
  assert.equal(
    ACHIEVEMENTS.find((entry) => entry.id === 'achievement.masterpiece-v1')?.threshold,
    16,
  );
});

test('Beutel und begrenzter Streuzustand besitzen echte PNGs mit binärem Alpha und identischen Pixelclustern', () => {
  for (const [name, width, height] of [
    ['intact', 32, 44],
    ['spilled', 96, 28],
  ] as const) {
    const image = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/food-bag/food-bag-${name}.png`, import.meta.url)),
    );

    assert.equal(image.width, width);
    assert.equal(image.height, height);
    assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 0));

    for (let y = 0; y < height; y += 2)
      for (let x = 0; x < width; x += 2) {
        const offset = (y * width + x) * 4;

        assertCluster(image, offset, width);
      }
  }
});

function assertCluster(image: PNG, offset: number, width: number) {
  assert.ok(image.data[offset + 3] === 0 || image.data[offset + 3] === 255);

  for (const next of [offset + 4, offset + width * 4, offset + width * 4 + 4])
    assert.deepEqual(image.data.subarray(offset, offset + 4), image.data.subarray(next, next + 4));
}
