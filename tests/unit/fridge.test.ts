/* eslint-disable max-lines-per-function -- Zustandsfolgen und eingefrorene Fortschrittsziele werden vollständig geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FridgeRummaging, FRIDGE_RULES } from '../../src/game/interactions/fridge-rummaging.ts';
import { discoverAlbum } from '../../src/content/album/index.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS_V5,
  destructionTarget,
} from '../../src/content/achievements.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { albumEntries } from '../../src/content/album/index.ts';

const fridge = () => new FridgeRummaging('fridge');

test('Frühes Weggehen bricht ab; Pixel verschwindet erst nach Warnzeit und kommt mit einmaligem Schaden zurück', () => {
  const f = fridge();

  f.update(300, true);
  assert.equal(f.snapshot().state, 'warning');
  f.update(0, false);
  assert.equal(f.snapshot().state, 'idle');
  f.update(500, true);
  assert.equal(f.snapshot().hidden, true);
  f.update(1399, false);
  assert.equal(f.snapshot().hidden, true);
  assert.deepEqual(f.update(1, false), chaosEvent('fridge', 'spill', 1, 24));
  assert.equal(f.snapshot().state, 'open');
  assert.equal(f.snapshot().hidden, false);
  assert.equal(f.update(10000, true), undefined);
  assert.equal(f.disturb(), undefined);
  f.reset();
  assert.deepEqual(f.snapshot(), { state: 'idle', hidden: false, progress: 0 });
});
test('Fremdtreffer öffnet den durcheinandergebrachten Kühlschrank, ohne Pixel hineinzuversetzen', () => {
  const f = fridge();

  assert.equal(f.disturb()?.kind, 'spill');
  assert.equal(f.snapshot().hidden, false);
  assert.equal(f.disturb(), undefined);
  f.reset();
  f.update(500, true);
  assert.equal(f.disturb(), undefined);
  assert.equal(f.snapshot().hidden, true);
  assert.equal(f.update(1400, false)?.value, 24);
});
test('Ungültige Zeiten, Punkte und IDs werden abgewiesen; inaktive Zeit macht keinen Fortschritt', () => {
  for (const key of ['warningMs', 'insideMs', 'points'])
    assert.throws(() => new FridgeRummaging('f', { ...FRIDGE_RULES, [key]: -1 }));
  assert.throws(() => new FridgeRummaging(''));
  const f = fridge();

  f.update(500, true);
  const before = f.snapshot();

  f.update(NaN, true);
  f.update(-1, true);
  f.update(0, true);
  assert.deepEqual(f.snapshot(), before);
});
test('Erst echter Innenraumschaden entdeckt die stabile Variante; bisherige Ziele bleiben eingefroren', () => {
  const event = chaosEvent('f', 'spill', 1, 24);

  assert.equal(discoverAlbum(event, 'cream-fridge')?.entryId, 'fridge.cream');
  assert.equal(discoverAlbum(chaosEvent('f', 'collapse', 2, 24), 'cream-fridge'), null);
  assert.equal(destructionTarget(event, 'fridge'), 'fridge');
  assert.equal(DESTRUCTION_TARGETS_V5.length, 12);
  assert.equal(ACHIEVEMENTS.find((a) => a.id === 'achievement.destruction-v6')?.threshold, 12);
  assert.equal(ACHIEVEMENTS.find((a) => a.id === 'achievement.masterpiece-v6')?.threshold, 35);
  const a = new AlbumCollection(new Set(albumEntries(false).map((e) => e.id)));
  const r = new RoundAlbum(a);

  r.record('fridge.cream');
  r.recordDamage(event, 'fridge', 'fridge.cream');
  r.confirm({
    score: 24,
    goalReached: false,
    reaction: 'Entspannt',
    dialogue: '',
    difficulty: 'normal',
    closingLine: '',
    outcome: 'failed',
    hearts: 0,
    required: 1,
    peaceful: false,
  });
  assert.equal(a.snapshot().discovered.includes('fridge.cream'), false);
});

test('Fridge graphics retain bounded transparent PNG cells and binary 2×2 clusters', async () => {
  const { PNG } = await import('pngjs');
  const { readFileSync } = await import('node:fs');

  for (const [name, width] of [
    ['upright', 160],
    ['open', 208],
  ] as const) {
    const p = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/fridge/${name}.png`, import.meta.url)),
    );

    assert.deepEqual([p.width, p.height], [width, 320]);
    const alpha = p.data.filter((_, i) => i % 4 === 3);

    assert.ok(alpha.includes(0));
    assert.ok(alpha.includes(255));
    assert.ok(alpha.every((v) => v === 0 || v === 255));

    for (let y = 0; y < p.height; y += 2)
      for (let x = 0; x < p.width; x += 2) {
        assertCluster(p, x, y);
      }
  }
});

test('Fester Kühlschrank und offene Tür müssen vollständig in den Raum passen', async () => {
  const { KITCHEN_PREVIEW } = await import('../../src/content/rooms/kitchen-preview.ts');
  const { OBJECTS } = await import('../../src/content/objects/catalog.ts');
  const { resolveRoom } = await import('../../src/game/content/resolve-room.ts');

  for (const change of [{ height: 310 }, { x: 1140 }]) {
    const room = {
      ...KITCHEN_PREVIEW,
      platforms: KITCHEN_PREVIEW.platforms.map((p) =>
        p.id === 'kitchen-fridge' ? { ...p, bounds: { ...p.bounds, ...change } } : p,
      ),
    };

    assert.throws(() => resolveRoom(room, OBJECTS), /fridge body or open door outside room/);
  }
});

function assertCluster(p: { data: Buffer; width: number }, x: number, y: number) {
  const sample = p.data.subarray((y * p.width + x) * 4, (y * p.width + x) * 4 + 4);

  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++) {
      const i = ((y + a) * p.width + x + b) * 4;

      assert.deepEqual(p.data.subarray(i, i + 4), sample);
    }
}
