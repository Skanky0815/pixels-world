/* eslint-disable max-lines-per-function -- Zusammenhängende Bedienwege prüfen Geometrie, echte Touch-Aktionen und erhaltene Auswahl gemeinsam. */
import type { Page } from '@playwright/test';
import { albumEntries } from '../../src/content/album/index';
import { changeLanguage, openPause } from './pause-support';
import { test, expect, loadIntro } from './support';

const savedEntries = albumEntries(true).map((entry) => entry.id);

/** A previously confirmed collection is storage data, not a game-state setter. */
async function openSavedAlbum(page: Page) {
  await page.addInitScript((discovered) => {
    localStorage.setItem('pixels-world.album', JSON.stringify({ version: 1, discovered }));
  }, savedEntries);
  await loadIntro(page);
  await page
    .locator('.start-screen')
    .getByRole('button', { name: 'Album öffnen', exact: true })
    .click();
}

async function expectBoundedAlbum(page: Page) {
  const album = page.locator('.album-dialog');
  const box = (await album.boundingBox())!;
  const viewport = page.viewportSize()!;

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(await album.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}

async function expectSeparateNavigation(page: Page) {
  const album = page.locator('.album-dialog');
  const tile = (await album.locator('.album-tile').last().boundingBox())!;
  const navigation = (await album.locator('.album-pagination').boundingBox())!;

  expect(tile.y + tile.height <= navigation.y || navigation.y + navigation.height <= tile.y).toBe(
    true,
  );
}

async function expectDetailFits(page: Page) {
  const album = page.locator('.album-dialog');
  const story = album.locator('.album-story');
  const picture = (await story.locator('figure').boundingBox())!;
  const copy = (await story.locator('.album-story-copy').boundingBox())!;
  const bounds = (await story.boundingBox())!;
  const image = (await story.locator('img').boundingBox())!;
  const back = (await story.locator('[data-action="overview"]').boundingBox())!;

  expect(picture.x + picture.width).toBeLessThanOrEqual(copy.x);
  expect(copy.y).toBeGreaterThanOrEqual(bounds.y);
  expect(copy.y + copy.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  expect(copy.y + copy.height).toBeLessThanOrEqual(back.y);
  expect(back.x + back.width).toBeCloseTo(bounds.x + bounds.width - 8, 0);
  expect(back.y + back.height).toBeCloseTo(bounds.y + bounds.height - 8, 0);
  expect(image.height).toBeGreaterThanOrEqual(24);
  expect(await story.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(await album.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
}

async function checkEveryDetail(page: Page) {
  const album = page.locator('.album-dialog');
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

  expect(seen.size).toBe(savedEntries.length);

  while (!(await album.locator('[data-action="page-previous"]').isDisabled()))
    await album.locator('[data-action="page-previous"]').tap();
}

test.describe('Album im Smartphone-Querformat', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 667, height: 375 },
    { width: 568, height: 320 },
    { width: 740, height: 300 },
  ]) {
    test(`${viewport.width}×${viewport.height}: Sechs Kacheln, Seiten und Kapitel passen ohne Scrollen`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openSavedAlbum(page);
      const album = page.locator('.album-dialog');

      await expectBoundedAlbum(page);
      await expectSeparateNavigation(page);
      await expect(album.locator('.album-tile')).toHaveCount(6);
      await checkEveryDetail(page);
      expect(await album.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
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
      await album.getByRole('tab', { name: 'Küche später', exact: true }).tap();
      await expect(album.locator('.album-empty')).toContainText(
        'Dieser Raum hat noch keine Album-Einträge.',
      );
      await album.getByRole('tab', { name: 'Wohnzimmer', exact: true }).tap();
      await expect(
        album.getByRole('button', { name: 'Album zurücksetzen', exact: true }),
      ).toHaveCount(0);
      await test
        .info()
        .attach('album-querformat', { body: await page.screenshot(), contentType: 'image/png' });
      await album.locator('[data-action="close"]').tap();
      await expect(album).toBeHidden();
      await expect(page.locator('.start-screen')).toBeVisible();

      if (viewport.height === 320) {
        await openPause(page);
        const options = page.locator('.pause-menu');

        await options.locator('[data-album-reset="ask"]').tap();
        await options.locator('[data-album-reset="confirm"]').tap();
        await options.locator('[data-pause-resume]').tap();
        await page.locator('[data-start-album]').tap();
        await expect(album.locator('.album-tile:disabled')).toHaveCount(6);
        expect(await album.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
        expect(
          await album
            .locator('.album-index')
            .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
        ).toBe(true);
        await album.locator('[data-action="close"]').tap();
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
      await page.locator('.album-dialog [data-action="close"]').tap();
      await changeLanguage(page, 'en');
      await page.locator('[data-start-album]').tap();
      await checkEveryDetail(page);
      await page.locator('.album-dialog [data-action="close"]').tap();
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
      const album = page.locator('.album-dialog');

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
      await album.locator('[data-action="close"]').tap();
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
    const album = page.locator('.album-dialog');

    await expectBoundedAlbum(page);
    await expectSeparateNavigation(page);
    await expect(album.locator('.album-story')).toBeVisible();
    await expect(album.locator('.album-index')).toBeVisible();
    expect(await album.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await album.getByRole('button', { name: 'Nächste Seite', exact: true }).click();
    await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
    await album.locator('[data-action="close"]').click();
    await expect(album).toBeHidden();
  });
}
