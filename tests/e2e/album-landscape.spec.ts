/* eslint-disable max-lines-per-function -- Zusammenhängende Bedienwege prüfen Geometrie, echte Touch-Aktionen und erhaltene Auswahl gemeinsam. */
import type { Page } from '@playwright/test';
import { albumEntries } from '../../src/content/album/index';
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

  expect(tile.y + tile.height).toBeLessThanOrEqual(navigation.y);
}

async function swipeAlbumUp(page: Page) {
  const album = page.locator('.album-dialog');
  const box = (await album.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height - 30;

  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });

  for (let step = 1; step <= 6; step++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - step * 24, id: 1 }],
    });
    await page.clock.runFor(32);
  }

  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.clock.runFor(100);
  expect(await album.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await touch.detach();
}

test.describe('Album im Smartphone-Querformat', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 667, height: 375 },
    { width: 568, height: 320 },
    { width: 740, height: 300 },
  ]) {
    test(`${viewport.width}×${viewport.height}: Kacheln, Seiten, Kapitel und Reset bleiben erreichbar`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openSavedAlbum(page);
      const album = page.locator('.album-dialog');

      await expectBoundedAlbum(page);
      await expectSeparateNavigation(page);
      await swipeAlbumUp(page);
      await album.getByRole('button', { name: 'Nächste Seite', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
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
      await album.locator('[data-action="reset"]').tap();
      await expect(album.locator('#album-reset-question')).toBeVisible();
      await album.locator('[data-action="cancel"]').tap();
      await expect(album.locator('.album-overall')).toHaveText(
        `Insgesamt: ${savedEntries.length} von ${savedEntries.length}`,
      );
      await test
        .info()
        .attach('album-querformat', { body: await page.screenshot(), contentType: 'image/png' });
      await album.locator('[data-action="close"]').tap();
      await expect(album).toBeHidden();
      await expect(page.locator('.start-screen')).toBeVisible();
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
      let box = (await album.boundingBox())!;

      expect(box.x).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(390 - 21);
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', 'Die blaue Vase');
      await expect(album.locator('.album-story')).toBeVisible();
      await album.getByRole('button', { name: 'Zur Übersicht', exact: true }).tap();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
      await expectSeparateNavigation(page);
      await album.getByRole('button', { name: 'Die blaue Vase', exact: true }).tap();
      await page.setViewportSize({ width: 390, height: 844 });
      await device.send('Emulation.setSafeAreaInsetsOverride', {
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      });
      await page.clock.runFor(64);
      box = (await album.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(844 - 34);
      await expect(album.locator('.album-story')).toHaveAttribute('aria-label', 'Die blaue Vase');
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
