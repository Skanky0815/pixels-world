/* eslint-disable max-lines-per-function -- Konfigurierbare Zugphasen, echte Grafikquellen und eingefrorene Erfolgsziele werden als zusammenhängende Verträge geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  TABLECLOTH_RULES,
  TableclothPull,
} from '../../src/game/interactions/tablecloth-pulling.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { KITCHEN } from '../../src/content/rooms/kitchen.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { discoverAlbum } from '../../src/content/album/index.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS_V4,
  destructionTarget,
} from '../../src/content/achievements.ts';
import { AchievementProgress } from '../../src/game/album/achievements.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import type { RoundResult } from '../../src/game/domain/round-result.ts';

test('Kurzer Kontakt lässt die Decke unversehrt; erst nach vollständiger Warnung beginnt der Zug', () => {
  const model = new TableclothPull('cloth', TABLECLOTH_RULES);

  assert.equal(model.update(599, true), undefined);
  assert.equal(model.snapshot().state, 'warning');
  assert.equal(model.snapshot().offset, 0);
  model.update(16, false);
  assert.equal(model.snapshot().state, 'idle');
  model.update(599, true);
  assert.equal(model.snapshot().offset, 0);
  model.update(1, true);
  assert.equal(model.snapshot().state, 'pulling');
  assert.equal(model.snapshot().offset, 0);
});

test('Teilzug bleibt nach Loslassen erhalten, verlangt beim Fortsetzen neue Warnzeit und endet genau einmal', () => {
  const model = new TableclothPull('cloth', TABLECLOTH_RULES);

  model.update(600, true);
  model.update(800, true);
  assert.equal(model.snapshot().offset, 80);
  model.update(1600, false);
  assert.equal(model.snapshot().offset, 80);
  model.update(600, true);
  assert.equal(model.snapshot().offset, 80);
  const event = model.update(1600, true);

  assert.deepEqual(event, chaosEvent('cloth', 'spill', 1, 12));
  assert.equal(model.snapshot().offset, 240);
  assert.equal(model.update(10000, true), undefined);
  assert.equal(model.displace(), undefined);
  model.reset();
  assert.deepEqual(model.snapshot(), { state: 'idle', progress: 0, warning: 0, offset: 0 });
});

test('Fremdzug und Auflagenverlust brauchen keine Pixelwarnung und erzeugen keinen doppelten Stoffschaden', () => {
  const model = new TableclothPull('cloth', TABLECLOTH_RULES);

  model.impulse();
  model.update(600, true);
  model.update(1000, false);
  assert.equal(model.snapshot().offset, 60);
  assert.equal(model.snapshot().state, 'idle');
  assert.deepEqual(model.displace(), chaosEvent('cloth', 'spill', 1, 12));
  model.impulse();
  assert.equal(model.displace(), undefined);
  assert.equal(model.snapshot().state, 'displaced');
});

test('Zugregeln sind geprüft und kopiert; ungültige Framezeit bewegt keinen Stoff', () => {
  for (const key of ['warningMs', 'pullMs', 'travel', 'points'] as const)
    for (const value of [-1, NaN, Infinity])
      assert.throws(
        () => new TableclothPull('cloth', { ...TABLECLOTH_RULES, [key]: value }),
        /configuration/,
      );
  assert.throws(() => new TableclothPull(' ', TABLECLOTH_RULES), /ID/);
  const rules = { ...TABLECLOTH_RULES, warningMs: 20 };
  const model = new TableclothPull('cloth', rules);

  rules.warningMs = 10000;
  model.update(20, true);
  assert.equal(model.snapshot().state, 'pulling');

  for (const value of [-100, NaN, Infinity]) model.update(value, true);
  assert.equal(model.snapshot().offset, 0);
});

test('Stoffmuster und abgelegte Decke sind echte PNGs mit 2×2-Clustern und passender Transparenz', () => {
  for (const [name, width, height] of [
    ['pattern', 32, 32],
    ['pile', 112, 36],
  ] as const) {
    const image = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/tablecloth/${name}.png`, import.meta.url)),
    );

    assert.equal(image.width, width);
    assert.equal(image.height, height);
    assert.ok(image.data.some((v, i) => i % 4 === 3 && v === 255));
    assert.ok(image.data.every((v, i) => i % 4 !== 3 || v === 0 || v === 255));
    assert.equal(
      image.data.some((v, i) => i % 4 === 3 && v === 0),
      name === 'pile',
    );

    assertClusters(image);
  }
});

test('Die Decke verlangt eine passende erhöhte Auflage; bloßes Berühren erzeugt keinen Albumfund', () => {
  const resolved = resolveRoom(KITCHEN, OBJECTS).objects.find((o) => o.kind === 'tablecloth')!;

  assert.equal(resolved.kind, 'tablecloth');

  if (resolved.kind !== 'tablecloth') throw new Error('Decke fehlt');
  assert.deepEqual(resolved.config.surface, { x: 340, y: 328, width: 220, height: 14 });
  assert.equal(resolved.config.hang, 100);
  const room = (surfaceId: string, x = 450) => ({
    ...KITCHEN,
    objects: [
      {
        id: 'cloth',
        variant: 'warm-tablecloth',
        placement: { mode: 'surface' as const, x, surfaceId },
      },
    ],
  });

  assert.throws(() => resolveRoom(room('floor'), OBJECTS), /geometry|raised support/);
  assert.throws(() => resolveRoom(room('kitchen-stool', 260), OBJECTS), /support surface/);
  assert.equal(
    discoverAlbum(chaosEvent('cloth', 'spill', 1, 12), 'warm-tablecloth')?.entryId,
    'tablecloth.warm',
  );
  assert.equal(discoverAlbum(chaosEvent('cloth', 'scratch', 1, 1), 'warm-tablecloth'), null);
  assert.equal(destructionTarget(chaosEvent('cloth', 'spill', 1, 12), 'tablecloth'), 'tablecloth');
});

test('Stofferfolg zählt erst nach erfolgreicher Versöhnung; bisherige Elferziele und Meisterwerke bleiben eingefroren', () => {
  const objective = (id: string) => ACHIEVEMENTS.find((entry) => entry.id === id)!;

  assert.equal(DESTRUCTION_TARGETS_V4.length, 11);
  assert.equal(objective('achievement.destruction-v5').threshold, 11);
  assert.equal(objective('achievement.masterpiece-v5').threshold, 32);
  assert.equal(objective('achievement.destruction-v6').threshold, 12);
  assert.equal(objective('achievement.masterpiece-v6').threshold, 35);
  const collection = new AlbumCollection(new Set(['tablecloth.warm']), undefined, false);
  const result: RoundResult = {
    score: 12,
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

  for (const outcome of ['failed', 'success'] as const) {
    const round = new RoundAlbum(collection);

    round.record('tablecloth.warm');
    round.recordDamage(chaosEvent('cloth', 'spill', 1, 12), 'tablecloth', 'tablecloth.warm');
    round.confirm({ ...result, outcome }, 'kitchen');
    assert.equal(round.confirmedBanners().includes('tablecloth.warm'), outcome === 'success');
    assert.equal(
      collection.achievementSnapshot().unlocked.includes('achievement.category-tablecloths-v6'),
      outcome === 'success',
    );
  }

  const previous = new AchievementProgress();

  previous.restore({ reconciliations: 0, ruined: [], unlocked: ['achievement.masterpiece-v5'] });
  assert.ok(previous.snapshot().unlocked.includes('achievement.masterpiece-v5'));
  assert.ok(!previous.snapshot().unlocked.includes('achievement.masterpiece-v6'));
});

function assertClusters(image: PNG) {
  for (let y = 0; y < image.height; y += 2)
    for (let x = 0; x < image.width; x += 2) {
      const offset = (y * image.width + x) * 4;

      for (const delta of [4, image.width * 4, image.width * 4 + 4])
        assert.deepEqual(
          image.data.subarray(offset, offset + 4),
          image.data.subarray(offset + delta, offset + delta + 4),
        );
    }
}
