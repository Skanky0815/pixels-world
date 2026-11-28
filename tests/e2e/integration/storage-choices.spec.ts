/* eslint-disable max-lines-per-function -- Explizite Auswahl, bestehende Daten, Reload und Rücknahme bilden den Datenschutzvertrag. */
import { test, expect } from '@playwright/test';
const base = 'http://127.0.0.1:4175/pixels-world/';

test('Speicherwahl: alte Albumfunde erhalten, erst auf Wunsch übernehmen, Offline-Kopie entfernen', async ({
  page,
  context,
}) => {
  const old = JSON.stringify({ version: 1, discovered: ['vase.blue'] });

  await page.addInitScript((raw) => {
    if (!localStorage.getItem('pixels-world.album'))
      localStorage.setItem('pixels-world.album', raw);
  }, old);
  await page.goto(base + 'play.html');
  await expect(page.locator('#loading-screen')).toHaveCount(0);
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-settings]').click();
  await expect(page.locator('[data-remember-album]')).not.toBeChecked();
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  await page.locator('.album-toggle').click();
  await expect(page.locator('.album-overall')).toContainText('0 von');
  await page.keyboard.press('Escape');
  await page.locator('[data-remember-album]').check();
  await page.locator('.album-toggle').click();
  await expect(page.locator('.album-overall')).toContainText('1 von');
  await page.keyboard.press('Escape');
  const migrated = await page.evaluate(() => localStorage.getItem('pixels-world.album'));

  expect(JSON.parse(migrated!)).toEqual({
    version: 2,
    discovered: ['vase.blue'],
    achievements: {
      reconciliations: 0,
      ruined: [],
      ruinedVariants: [],
      completedRooms: [],
      unlocked: [],
    },
  });
  await page.locator('[data-remember-album]').uncheck();
  expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBe(migrated);
  await page.reload();
  await expect(page.locator('#loading-screen')).toHaveCount(0);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.locator('.album-toggle').click();
  const album = page.locator('.album-screen');
  const header = await page.locator('main > header').boundingBox();
  const footer = await page.locator('main > footer').boundingBox();

  expect(await album.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expect(page.locator('.album-screen .album-overall')).toContainText(
    'Album nur für diesen Besuch.',
  );
  // The regular album view scrolls inside the shell on short screens.
  await album.hover();
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => album.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.locator('main > header').boundingBox()).toEqual(header);
  expect(await page.locator('main > footer').boundingBox()).toEqual(footer);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('main > header .pause-toggle')).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Escape');
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-settings]').click();
  await expect(page.locator('[data-remember-album]')).not.toBeChecked();
  await page.evaluate(() => caches.open('unrelated-project'));
  await page.locator('[data-offline-game]').click();
  await expect(page.locator('[data-offline-game]')).toBeEnabled({ timeout: 20000 });
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  expect(await page.evaluate(() => caches.keys())).toHaveLength(2);
  const other = await context.newPage();

  await other.goto(base + 'play.html');
  await expect(other.locator('#loading-screen')).toHaveCount(0);
  await other.locator('.pause-toggle').click();
  await other.locator('[data-menu-settings]').click();
  await Promise.all([
    other.locator('[data-update-check]').click(),
    page.locator('[data-offline-game]').click(),
  ]);
  await expect(other.locator('[data-update-check]')).toBeEnabled();
  await expect(other.locator('[data-offline-game]')).toHaveText('Offline-Spiel vorbereiten');
  await other.close();
  await expect(page.locator('[data-offline-game]')).toBeEnabled();
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual(['unrelated-project']);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('[data-pause-storage]')).toContainText('Remember my album');
  await expect(page.locator('[data-pause-storage]')).toContainText('Prepare offline play');
});
