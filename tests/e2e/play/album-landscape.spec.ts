/* eslint-disable max-lines-per-function -- Zusammenhängende Bedienwege prüfen Geometrie, echte Touch-Aktionen und erhaltene Auswahl gemeinsam. */
import type { Locator, Page } from '@playwright/test';
import { ALBUM_ROOMS } from '../../../game/play/ui/album-markup';
import { albumEntries } from '../../../game/play/content/album/index';
import { changeLanguage, openPause, returnToMenu } from '../support/pause-support';
import { introAction, test, expect, loadIntro } from '../support/support';

const savedEntries = albumEntries(true).map((entry) => entry.id);

/** A previously confirmed collection is storage data, not a game-state setter. */
// Existing persistence/layout contracts start with a returning player's saved choice.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}'),
  );
});

async function openSavedAlbum(page: Page) {
  await page.addInitScript((discovered) => {
    localStorage.setItem('pixels-world.album', JSON.stringify({ version: 1, discovered }));
  }, savedEntries);
  await loadIntro(page);
  await (await introAction(page, 'album')).click();
}

async function expectBoundedAlbum(page: Page) {
  const album = page.locator('.album-screen');
  const box = (await album.boundingBox())!;
  const viewport = page.viewportSize()!;

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(await album.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const header = (await page.locator('main > header').boundingBox())!;
  const footer = (await page.locator('main > footer').boundingBox())!;

  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(box.y + box.height).toBeLessThanOrEqual(footer.y + 1);
  expect(await page.evaluate(() => scrollY)).toBe(0);
}

async function expectSeparateNavigation(page: Page) {
  const album = page.locator('.album-screen');
  const tile = (await album.locator('.album-tile').last().boundingBox())!;
  const navigation = (await album.locator('.album-pagination').boundingBox())!;

  expect(tile.y + tile.height <= navigation.y || navigation.y + navigation.height <= tile.y).toBe(
    true,
  );
}

async function expectDetailFits(page: Page) {
  const story = page.locator('.album-screen .album-story');
  const picture = (await story.locator('figure').boundingBox())!;
  const copy = (await story.locator('.album-story-copy').boundingBox())!;
  const back = story.locator('[data-action="overview"]');

  expect(picture.x + picture.width).toBeLessThanOrEqual(copy.x);
  expect((await story.locator('img').boundingBox())!.height).toBeGreaterThanOrEqual(24);
  expect(await story.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);

  // Persistent shell chrome leaves less room than the former modal; all text stays scrollable.
  for (const text of await story.locator('.album-story-copy > p, blockquote').all()) {
    await text.scrollIntoViewIfNeeded();
    await expectReadable(text);
  }

  await back.scrollIntoViewIfNeeded();
  await expectReadable(back);
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expectBoundedAlbum(page);
}

async function checkChapterDetails(page: Page) {
  const album = page.locator('.album-screen');
  const seen = new Set<string>();

  for (let index = 0; index < savedEntries.length; index++) {
    const entries = await album
      .locator('[data-entry]')
      .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-entry')!));

    for (const entry of entries) {
      await album.locator(`[data-entry="${entry}"]`).tap();
      await expectDetailFits(page);
      seen.add(entry);

      if (index === 0 && entry === entries.at(-1))
        await test.info().attach('album-detail-querformat', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      await album.locator('[data-action="overview"]').tap();
    }

    if (await album.locator('[data-action="page-next"]').isDisabled()) break;
    await album.locator('[data-action="page-next"]').tap();
  }

  return seen;
}

async function checkEveryDetail(page: Page) {
  const album = page.locator('.album-screen');
  const seen = new Set<string>();

  for (const room of ALBUM_ROOMS.filter((id) =>
    albumEntries(true).some((e) => e.rooms.includes(id)),
  )) {
    await album.locator(`[data-room="${room}"]`).tap();
    const entries = await checkChapterDetails(page);

    for (const entry of entries) seen.add(`${room}/${entry}`);
  }

  expect(seen.size).toBe(
    albumEntries(true).reduce((total, entry) => total + entry.rooms.length, 0),
  );
  await album.locator('[data-room="living-room"]').tap();
}

test.describe('Album im Smartphone-Querformat', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 667, height: 375 },
    { width: 568, height: 320 },
    { width: 740, height: 300 },
  ]) {
    test(`${viewport.width}×${viewport.height}: Sechs Kacheln, Seiten und Kapitel bleiben in der Shell erreichbar`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openSavedAlbum(page);
      const album = page.locator('.album-screen');

      await expectBoundedAlbum(page);
      await expectSeparateNavigation(page);
      await expect(album.locator('.album-tile')).toHaveCount(6);
      await checkEveryDetail(page);
      await expectBoundedAlbum(page);
      expect(
        await album
          .locator('.album-index')
          .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true);
      await album.getByRole('button', { name: 'Nächste Seite', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 3');
      await album.getByRole('button', { name: 'Vorige Seite', exact: true }).tap();
      const tile = album.locator('.album-tile').last();
      const selected = (await tile.getAttribute('aria-label'))!;

      await tile.tap();
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', selected);
      await expect(album.locator('.album-story')).toBeVisible();
      await album.getByRole('button', { name: 'Zur Übersicht', exact: true }).tap();
      await album.getByRole('tab', { name: 'Schlafzimmer', exact: true }).tap();
      await expect(album.locator('.album-tile')).toHaveCount(6);
      await expect(album.locator('.album-tile img')).toHaveCount(6);
      await expectBoundedAlbum(page);
      await album.getByRole('tab', { name: 'Arbeitszimmer', exact: true }).tap();
      await expect(album.locator('.album-tile')).toHaveCount(6);
      await expect(album.locator('.album-tile img')).toHaveCount(6);
      await expectBoundedAlbum(page);
      await album.getByRole('tab', { name: 'Wohnzimmer', exact: true }).tap();
      await expect(
        album.getByRole('button', { name: 'Album zurücksetzen', exact: true }),
      ).toHaveCount(0);
      await test
        .info()
        .attach('album-querformat', { body: await page.screenshot(), contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await expect(album).toBeHidden();
      await expect(page.locator('.pause-menu')).toBeVisible();
      await page.locator('[data-pause-resume]').tap();
      await expect(page.locator('.start-screen')).toBeVisible();

      if (viewport.height === 320) {
        await openPause(page);
        const options = page.locator('.pause-menu');

        await options.locator('[data-album-reset="ask"]').tap();
        await options.locator('[data-album-reset="confirm"]').tap();
        await returnToMenu(page);
        await options.locator('[data-pause-resume]').tap();
        await (await introAction(page, 'album')).tap();
        await expect(album.locator('.album-tile:disabled')).toHaveCount(6);
        await expectBoundedAlbum(page);
        expect(
          await album
            .locator('.album-index')
            .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
        ).toBe(true);
        await page.keyboard.press('Escape');
      }
    });
  }

  for (const viewport of [
    { width: 568, height: 320 },
    { width: 740, height: 300 },
  ]) {
    test(`${viewport.width}×${viewport.height}: auch alle englischen Detailtexte passen neben das Bild`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openSavedAlbum(page);
      await page.keyboard.press('Escape');
      await changeLanguage(page, 'en');
      await (await introAction(page, 'album')).tap();
      await checkEveryDetail(page);
      await page.keyboard.press('Escape');
    });
  }

  test(
    'Drehen erhält ausgewählten Eintrag und Seite; Notch und Home-Leiste bleiben frei',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const device = await page.context().newCDPSession(page);

      await device.send('Emulation.setSafeAreaInsetsOverride', {
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      });
      await openSavedAlbum(page);
      const album = page.locator('.album-screen');

      await album.getByRole('button', { name: 'Nächste Seite', exact: true }).tap();
      await album.getByRole('button', { name: 'Die blaue Vase', exact: true }).tap();
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', 'Die blaue Vase');
      await page.setViewportSize({ width: 844, height: 390 });
      await device.send('Emulation.setSafeAreaInsetsOverride', {
        insets: { top: 0, left: 44, right: 0, bottom: 21 },
      });
      await page.clock.runFor(64);
      await expectBoundedAlbum(page);
      await expectDetailFits(page);
      let box = (await album.boundingBox())!;

      expect(box.x).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(390 - 21);
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', 'Die blaue Vase');
      await expect(album.locator('.album-story')).toBeVisible();
      await album.getByRole('button', { name: 'Zur Übersicht', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 3');
      await expectSeparateNavigation(page);
      await album.getByRole('button', { name: 'Nächste Seite', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 3 von 3');
      const lastTile = album.locator('.album-tile').last();
      const selected = (await lastTile.getAttribute('aria-label'))!;

      await lastTile.tap();
      await page.setViewportSize({ width: 390, height: 844 });
      await device.send('Emulation.setSafeAreaInsetsOverride', {
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      });
      await page.clock.runFor(64);
      box = (await album.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(844 - 34);
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', selected);
      await album.getByRole('button', { name: 'Zur Übersicht', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
      await page.keyboard.press('Escape');
      await expect(album).toBeHidden();
    },
  );
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 1024, height: 768 },
]) {
  test(`${viewport.width}×${viewport.height}: beide Buchseiten bleiben ohne äußeres Scrollen sichtbar`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openSavedAlbum(page);
    const album = page.locator('.album-screen');

    await expectBoundedAlbum(page);
    await expectSeparateNavigation(page);
    await expect(album.locator('.album-story')).toBeVisible();
    await expect(album.locator('.album-index')).toBeVisible();
    await expectBoundedAlbum(page);
    await album.getByRole('button', { name: 'Nächste Seite', exact: true }).click();
    await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
    await page.keyboard.press('Escape');
    await expect(album).toBeHidden();
  });
}

async function expectReadable(target: Locator) {
  await expect(target).toBeInViewport({ ratio: 0.95 });
  const clipped = await target.evaluate((element) => {
    const box = element.getBoundingClientRect();
    let top = box.top;
    let bottom = box.bottom;

    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (!/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflowY)) continue;
      const clip = parent.getBoundingClientRect();

      top = Math.max(top, clip.top + parent.clientTop);
      bottom = Math.min(bottom, clip.top + parent.clientTop + parent.clientHeight);
    }

    return Math.max(top - box.top, box.bottom - bottom);
  });

  // Nested native scrolling rounds offsets; at most one CSS pixel may be clipped.
  expect(clipped).toBeLessThanOrEqual(1);
}
