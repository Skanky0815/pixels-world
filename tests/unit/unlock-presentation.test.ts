/* eslint-disable max-lines-per-function -- Katalogkonsistenz, Bilddateien und gemeinsame Bannerfolge werden als vollständige Darstellungsverträge geprüft. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ACHIEVEMENTS, type AchievementDefinition } from '../../game/play/content/achievements.ts';
import { INTERACTABLE_ALBUM } from '../../game/play/content/album/index.ts';
import { AlbumBannerQueue } from '../../game/play/album/banner-queue.ts';
import { EMPTY_ACHIEVEMENTS } from '../../game/play/album/achievements.ts';
import { entryImage } from '../../game/play/ui/album-markup.ts';
import { achievementsMarkup } from '../../game/play/ui/achievement-markup.ts';
import {
  albumPresentation,
  achievementPresentation,
  unlockPresentation,
} from '../../game/play/ui/unlock-presentation.ts';

const albums = Object.values(INTERACTABLE_ALBUM);
const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test('Albumfunde und sämtliche Erfolgsfassungen besitzen eindeutige gemeinsame Freischalt-IDs', () => {
  const ids = [...albums, ...ACHIEVEMENTS].map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const id of ids) {
    const presentation = unlockPresentation(id);

    assert.ok(presentation, id);
    assert.equal(presentation.id, id);
    assert.ok(Object.isFrozen(presentation));
    assert.deepEqual(readFileSync(new URL(presentation.image)).subarray(0, 8), pngHeader, id);
  }
});

test('Albumansicht und Banner verwenden dieselben Bilder und unveränderte Katalogtitel, auch für DEV-Einträge', () => {
  for (const entry of albums) {
    const presentation = albumPresentation(entry)!;

    assert.equal(presentation.kind, 'album');
    assert.equal(presentation.name, entry.name);
    assert.deepEqual(unlockPresentation(entry.id), presentation);
    assert.ok(entryImage(entry).includes(presentation.image), entry.id);
  }
});

test('Erfolgsansicht und Banner teilen Bildzuordnung und Titel für Einzel- und Gesamterfolge', () => {
  for (const entry of ACHIEVEMENTS) {
    const presentation = achievementPresentation(entry)!;
    const markup = achievementsMarkup({ ...EMPTY_ACHIEVEMENTS, unlocked: [entry.id] }, entry.id);

    assert.equal(presentation.kind, 'achievement');
    assert.equal(presentation.name, entry.name);
    assert.deepEqual(unlockPresentation(entry.id), presentation);
    assert.ok(markup.includes(`<img src="${presentation.image}"`), entry.id);
  }
});

test('Unbekannte IDs und fehlende oder geerbte Bildschlüssel ergeben kein defektes Bild', () => {
  for (const id of [null, '', 'unknown', 'toString', '__proto__'])
    assert.equal(unlockPresentation(id), null);

  for (const asset of ['missing', '', 'toString', '__proto__']) {
    const entry = { ...albums[0], asset };

    assert.equal(albumPresentation(entry), null);
    assert.equal(entryImage(entry), '');
  }

  for (const art of ['missing', 'toString', '__proto__'])
    assert.equal(
      achievementPresentation({ ...ACHIEVEMENTS[0], art } as AchievementDefinition),
      null,
    );
});

test('Eine gemeinsame Queue erhält Fund, Einzelerfolg und Gesamterfolg einmalig; ungültige IDs verändern die Folge nicht', () => {
  const queue = new AlbumBannerQueue();
  const entries = ['couch.cozy', 'unknown', 'achievement.angel-1', 'achievement.masterpiece-v1'];

  queue.start(entries);

  for (const id of entries) {
    assert.equal(queue.current(), id);
    assert.equal(unlockPresentation(id)?.id ?? null, id === 'unknown' ? null : id);
    assert.equal(queue.start(entries), false);
    queue.advance(3000);
  }

  assert.equal(queue.current(), null);
  assert.equal(unlockPresentation(queue.current()), null);
  assert.equal(queue.start(entries), false);
});
