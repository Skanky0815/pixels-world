import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlantNibbling } from '../../src/game/interactions/plant-nibbling.ts';
import { PictureFalling, PICTURE_RULES } from '../../src/game/interactions/picture-falling.ts';
import { ShelfStability } from '../../src/game/domain/shelf-stability.ts';

// eslint-disable-next-line max-lines-per-function -- Ein Fremdtreffer kippt ohne erfundene Knabberstufe und bleibt bis zum Reset einmalig.
test('Pflanze kippt durch Fremdtreffer ohne Knabberereignis', () => {
  const plant = new PlantNibbling(undefined, 'plant');
  const event = plant.tip();

  assert.equal(event?.kind, 'tip');
  assert.equal(event?.value, 10);
  assert.equal(plant.tip(), undefined);
  assert.equal(plant.update(10_000, true), undefined);
  assert.equal(plant.snapshot().state, 'tipped');
  plant.reset();
  assert.equal(plant.snapshot().damage, 0);
  assert.equal(plant.tip()?.kind, 'tip');
});

test('Fremdtreffer hängt ein Bild schief oder löst den Fall aus', () => {
  const picture = new PictureFalling('picture');

  picture.impact(false);
  assert.equal(picture.snapshot().state, 'crooked');
  picture.impact(true);
  picture.impact(true);
  const contact = { grounded: true, climbing: false, velocityY: 0, touching: false };

  assert.equal(picture.update(PICTURE_RULES.fallMs, contact)?.kind, 'picture-fall');
  assert.equal(picture.update(PICTURE_RULES.fallMs, contact), undefined);
});

// eslint-disable-next-line max-lines-per-function -- Stabile Zielregale widerstehen auch starken Stößen; fragile liefern nur noch nicht vergebene Schadensstufen.
test('Schwerer Treffer zerstört ein fragiles Regal einmalig und schützt stabile Zielregale', () => {
  const shelf = new ShelfStability('shelf', { stability: 'fragile' });
  const stable = new ShelfStability('goal', { stability: 'stable' });

  assert.deepEqual(
    shelf.collapse().map((event) => event.kind),
    ['shelf-damage', 'collapse'],
  );
  assert.deepEqual(shelf.collapse(), []);
  assert.deepEqual(stable.collapse(), []);
  assert.equal(stable.impact(), undefined);
  assert.equal(stable.snapshot().state, 'intact');
  shelf.reset();
  shelf.impact();
  shelf.impact();
  assert.deepEqual(
    shelf.collapse().map((event) => event.kind),
    ['collapse'],
  );
});
