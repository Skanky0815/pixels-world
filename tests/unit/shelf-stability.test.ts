import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ShelfStability,
  shelfRules,
  shelfWobbleAngle,
} from '../../src/game/domain/shelf-stability.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';

function land(shelf: ShelfStability) {
  shelf.observe(false, true);
  shelf.observe(true, false);

  return shelf.observe(false, true);
}

// eslint-disable-next-line max-lines-per-function -- Ein kompletter Belastungsverlauf prüft Warnung, beide einmaligen Schadensereignisse und Reset gemeinsam.
test('Fragiles Regal zählt nur echte Landungen und stürzt nach drei Flügen ein', () => {
  const shelf = new ShelfStability('shelf', { stability: 'fragile' });
  const score = new ChaosScore();

  for (let i = 0; i < 20; i++) assert.equal(shelf.observe(false, true), undefined);
  assert.equal(shelf.snapshot().landings, 0);
  assert.equal(land(shelf), undefined);
  assert.equal(shelf.snapshot().state, 'wobbly');

  for (let i = 0; i < 20; i++) assert.equal(shelf.observe(false, true), undefined);
  const damage = land(shelf);

  assert.ok(damage);
  assert.equal(damage.kind, 'shelf-damage');
  assert.equal(shelf.snapshot().state, 'damaged');
  score.awardEvent(damage);
  assert.equal(score.awardEvent(damage), false);
  const collapse = land(shelf);

  assert.ok(collapse);
  assert.equal(collapse.kind, 'collapse');
  score.awardEvent(collapse);
  assert.equal(score.score, 12);
  assert.equal(score.count, 1);
  assert.equal(shelf.snapshot().state, 'collapsed');
  assert.equal(land(shelf), undefined);
  assert.equal(shelf.snapshot().landings, 3);
  shelf.reset();
  assert.deepEqual(shelf.snapshot(), { stability: 'fragile', state: 'intact', landings: 0 });
});

test('Normal hält fünf Landungen aus; eine Landung auf anderem Boden verbraucht den Flug', () => {
  const shelf = new ShelfStability('shelf', { stability: 'normal' });

  shelf.observe(true, false);
  shelf.observe(false, false);
  assert.equal(shelf.observe(false, true), undefined);
  assert.equal(shelf.snapshot().landings, 0);

  for (let i = 0; i < 4; i++) land(shelf);
  assert.equal(shelf.snapshot().state, 'damaged');
  assert.equal(land(shelf)?.kind, 'collapse');
});

test('Stabile Regale bleiben dauerhaft intakt', () => {
  const shelf = new ShelfStability('goal', { stability: 'stable' });

  for (let i = 0; i < 100; i++) assert.equal(land(shelf), undefined);
  assert.deepEqual(shelf.snapshot(), { stability: 'stable', state: 'intact', landings: 0 });
});

// eslint-disable-next-line max-lines-per-function -- Ungültige Schwellen, eine verbotene stabile Konfiguration und negative Punkte prüfen unterschiedliche Validierungsgrenzen.
test('Eigene Schwellen sind konfigurierbar, ungültige Regeln werden abgewiesen', () => {
  assert.throws(
    () =>
      shelfRules({
        stability: 'fragile',
        rules: { warningAt: 2, damageAt: 1, collapseAt: 3, damageValue: 2, collapseValue: 10 },
      }),
    /thresholds/,
  );
  assert.throws(
    () => shelfRules({ stability: 'stable', rules: shelfRules({ stability: 'normal' }) }),
    /Stable/,
  );
  assert.throws(
    () =>
      shelfRules({
        stability: 'fragile',
        rules: { ...shelfRules({ stability: 'normal' }), damageValue: -1 },
      }),
    /rules/,
  );
});

test('Das Ziel darf nicht auf einem einstürzenden Regal liegen', () => {
  const platforms = LIVING_ROOM.platforms.map((p) => ({
    ...p,
    durability: { stability: 'fragile' as const },
  }));

  assert.throws(
    () => resolveRoom({ ...LIVING_ROOM, platforms }, OBJECTS),
    /goal shelf must remain stable/,
  );
});

test('Die erste Landung beim Einsetzen erzeugt keine Belastung', () => {
  const shelf = new ShelfStability('shelf', { stability: 'fragile' });

  shelf.observe(true, false);
  shelf.observe(false, true);
  assert.equal(shelf.snapshot().landings, 0);
  land(shelf);
  assert.equal(shelf.snapshot().landings, 1);
});

test('Eine Instanz kann eigene Belastungsschwellen erhalten', () => {
  const shelf = new ShelfStability('custom', {
    stability: 'fragile',
    rules: { warningAt: 1, damageAt: 3, collapseAt: 8, damageValue: 4, collapseValue: 20 },
  });

  for (let i = 0; i < 7; i++) land(shelf);
  assert.equal(shelf.snapshot().state, 'damaged');
  assert.equal(land(shelf)?.value, 20);
});

test('Warnwackeln ist ein kurzer gedämpfter Impuls und endet vollständig', () => {
  assert.notEqual(shelfWobbleAngle(50, false), 0);
  assert.ok(Math.abs(shelfWobbleAngle(50, true)) > Math.abs(shelfWobbleAngle(50, false)));
  assert.equal(shelfWobbleAngle(650, false), 0);
  assert.equal(shelfWobbleAngle(2000, true), 0);
  assert.equal(shelfWobbleAngle(-1, false), 0);
});
