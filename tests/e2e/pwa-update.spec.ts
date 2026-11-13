import { enterSelectedRoom } from './support';
/* eslint-disable max-lines-per-function -- Echter A→B-Wechsel, unterbrochene Installation und zwei unabhängige Tabs bilden einen zusammenhängenden Release-Ablauf. */
import { test, expect, type Page } from '@playwright/test';

const origin = 'http://127.0.0.1:4178';

test.describe.configure({ mode: 'serial' });

for (const scope of ['/', '/pixels-world/']) {
  test(`Release A→B unter ${scope}: vollständiger Cache, Offline, zwei Tabs und gespeicherte Funde`, async ({
    page,
    context,
    request,
  }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    await request.post(`${origin}/__release?scope=${scope}&release=a`);
    await page.goto(origin + scope + 'play.html');
    await intro(page);
    await menu(page);
    await page.locator('[data-offline-game]').click();
    await expect(page.locator('[data-offline-game]')).toBeEnabled({ timeout: 20000 });
    await closeMenu(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      localStorage.setItem(
        'pixels-world.album',
        JSON.stringify({ version: 1, discovered: ['vase.blue'] }),
      );
      localStorage.setItem('pixels-world.audio', JSON.stringify({ master: 0.3, effects: 0.6 }));
      localStorage.setItem('pixels-world.difficulty', 'easy');
    });
    await page.reload();
    await intro(page);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await menu(page);
    await expect(page.locator('[data-update-version]')).toHaveText(
      'Spielversion v0.0.1-update-test',
    );
    await context.setOffline(true);
    await page.locator('[data-update-check]').click();
    await expect(page.locator('[data-update-status]')).toContainText('Du bist offline');
    await context.setOffline(false);
    await page.locator('[data-update-check]').click();
    await expect(page.locator('[data-update-status]')).toContainText('aktuelle Version');
    await closeMenu(page);
    await beginRound(page);
    const oldOrigin = await page.evaluate(() => performance.timeOrigin);
    const saved = await storage(page);
    const other = await context.newPage();

    other.on('pageerror', (error) => errors.push(error.message));
    await other.goto(origin + scope + 'play.html');
    await intro(other);
    await menu(other);
    // A missing new chunk must prevent activation; the old round keeps running.
    await request.post(`${origin}/__release?scope=${scope}&release=b&broken=1`);
    await other.locator('[data-update-check]').click();
    await expect
      .poll(async () => (await (await request.get(origin + '/__status')).json()).blocked.length)
      .toBeGreaterThan(0);
    await expect(other.locator('[data-update-status]')).toContainText(
      'nicht geprüft oder gestartet',
    );
    await expect(other.locator('[data-update-offer]')).toBeHidden();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(oldOrigin);
    await request.post(`${origin}/__release?scope=${scope}&release=b`);
    await other.locator('[data-update-check]').click();
    await expect(other.locator('[data-update-offer]')).toBeVisible();
    await expect(other.locator('[data-update-warning]')).toContainText('laufende Runde endet');
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(oldOrigin);
    await other.locator('[data-update-later]').click();
    await expect(other.locator('[data-update-offer]')).toBeHidden();
    await other.getByRole('button', { name: 'English', exact: true }).click();
    await other.locator('[data-update-check]').click();
    await expect(other.locator('[data-update-apply]')).toHaveText('Update now');
    await other.locator('[data-update-apply]').click();
    await intro(other);
    await menu(other);
    await expect(other.locator('[data-update-version]')).toHaveText(
      'Game version v0.0.2-update-test',
    );
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(oldOrigin);
    await page.bringToFront();
    await page.locator('#game').focus();

    // Focus can pause the old round; resume it explicitly, without starting a new one.
    if (await page.locator('.pause-menu').isVisible()) await closeMenu(page);
    await expect(page.locator('.start-screen')).toBeHidden();
    await page.keyboard.down('ArrowRight');
    const before = (await page.locator('canvas').screenshot()).toString('base64');

    await expect
      .poll(async () => (await page.locator('canvas').screenshot()).toString('base64'))
      .not.toBe(before);
    await page.keyboard.up('ArrowRight');
    await menu(page);
    await expect(page.locator('[data-update-offer]')).toBeVisible();
    await expect(page.locator('[data-update-version]')).toHaveText(
      'Spielversion v0.0.1-update-test',
    );
    await page.locator('[data-update-apply]').click();
    await intro(page);
    await menu(page);
    await expect(page.locator('[data-update-version]')).toHaveText(
      'Game version v0.0.2-update-test',
    );
    const after = await storage(page);

    for (const key of Object.keys(saved)) expect(after[key]).toBe(saved[key]);
    await context.setOffline(true);
    await page.reload();
    await intro(page);
    await menu(page);
    await expect(page.locator('[data-update-version]')).toContainText('0.0.2-update-test');
    await page
      .locator('.pause-menu')
      .screenshot()
      .then((body) => testInfo.attach('updated-offline-menu', { body, contentType: 'image/png' }));
    await context.setOffline(false);
    await other.close();
    expect(errors).toEqual([]);
  });
}

async function intro(page: Page) {
  await expect(page.locator('#loading-screen')).toHaveCount(0, { timeout: 20_000 });
  await enterSelectedRoom(page);
  await expect(page.locator('canvas')).toBeVisible();
}

async function menu(page: Page) {
  if (!(await page.locator('.pause-menu').isVisible())) await page.locator('.pause-toggle').click();
  await expect(page.locator('.pause-menu')).toBeVisible();
}

async function closeMenu(page: Page) {
  await page.locator('[data-pause-resume]').click();
  await page.locator('#game').focus();
}

async function beginRound(page: Page) {
  await page.keyboard.down('Space');
  await expect(page.locator('.start-screen')).toBeHidden();
  await page.keyboard.up('Space');
}

async function storage(page: Page) {
  return page.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(([key]) =>
        ['pixels-world.album', 'pixels-world.audio', 'pixels-world.difficulty'].includes(key),
      ),
    ),
  );
}

// First installation intentionally does not claim/reload the page already being played.
test('Erster unkontrollierter Besuch bietet ein inzwischen aktiviertes Update bewusst an', async ({
  page,
  request,
}) => {
  await request.post(`${origin}/__release?scope=/&release=a&registration=broken`);
  await page.goto(origin + '/play.html');
  await intro(page);
  await menu(page);
  await page.locator('[data-offline-game]').click();
  await expect(page.locator('[data-offline-game]')).toBeEnabled({ timeout: 20000 });
  await page.locator('[data-update-check]').click();
  await expect(page.locator('[data-update-status]')).toContainText('nicht geprüft oder gestartet');
  await request.post(`${origin}/__release?scope=/&release=a`);
  await page.locator('[data-update-check]').click();
  await expect(page.locator('[data-update-status]')).toContainText('aktuelle Version');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  await menu(page);
  await request.post(`${origin}/__release?scope=/&release=b`);
  await page.locator('[data-update-check]').click();
  await expect(page.locator('[data-update-offer]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.locator('[data-update-apply]').click();
  await intro(page);
  await menu(page);
  await expect(page.locator('[data-update-version]')).toHaveText('Spielversion v0.0.2-update-test');
});

test('Online-Update benötigt keine Offline-Registrierung und startet erst nach Bestätigung neu', async ({
  page,
  request,
}) => {
  await request.post(`${origin}/__release?scope=/&release=a`);
  await page.goto(origin + '/play.html');
  await intro(page);
  await menu(page);
  await page.locator('[data-update-check]').click();
  await expect(page.locator('[data-update-status]')).toContainText('aktuelle Version');
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  const before = await page.evaluate(() => performance.timeOrigin);

  await request.post(`${origin}/__release?scope=/&release=b`);
  await page.locator('[data-update-check]').click();
  await expect(page.locator('[data-update-offer]')).toBeVisible();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(before);
  await page.locator('[data-update-apply]').click();
  await intro(page);
  await menu(page);
  await expect(page.locator('[data-update-version]')).toContainText('0.0.2-update-test');
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
});
