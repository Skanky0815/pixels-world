import type { Page } from '@playwright/test';
import { test, expect, loadIntro, state, until, besideCouch } from './support';
import { startTouch } from './touch-support';

test.use({ hasTouch: true, isMobile: true });

for (const viewport of [
  { width: 568, height: 320, minRoomWidth: 240, inset: 0 },
  { width: 667, height: 375, minRoomWidth: 335, inset: 0 },
  { width: 844, height: 330, minRoomWidth: 420, inset: 49 },
  { width: 844, height: 390, minRoomWidth: 520, inset: 0 },
  { width: 1024, height: 768, minRoomWidth: 620, inset: 0 },
]) {
  // eslint-disable-next-line max-lines-per-function -- Sichtbare Geometrie, Schärfe und Touch-Ziele werden zusammen für denselben Viewport geprüft.
  test(`Klassische Übersicht ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startLayout(page, viewport.height <= 550, viewport.inset);
    const room = await page.locator('#game').boundingBox();
    const left = await page.locator('.touch-directions').boundingBox();
    const right = await page.locator('.touch-actions').boundingBox();

    expect(room && left && right).toBeTruthy();

    if (!room || !left || !right) throw new Error('Layout fehlt');
    await layoutGeometry(page, viewport.height, room, left, right, viewport.inset);

    const canvas = await page.locator('canvas').boundingBox();

    expect(canvas).not.toBeNull();
    expect(canvas!.width).toBeGreaterThanOrEqual(viewport.minRoomWidth);
    expect(canvas!.width / canvas!.height).toBeCloseTo(16 / 9, 1);
    expect(
      await page.locator('canvas').evaluate((node) => getComputedStyle(node).imageRendering),
    ).toBe('pixelated');
    await expect(page.getByRole('region', { name: 'Spielstatus' })).toContainText('CHAOS:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await test.info().attach('handheld', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    if (viewport.width === 568) await informationMenu(page);
  });
}

// eslint-disable-next-line max-lines-per-function -- Die echte Startaktion muss Rahmen und Tasten unverändert lassen und vorher die Altersinformation zeigen.
async function startLayout(page: Page, phone: boolean, inset: number) {
  await loadIntro(page, '/?camera=room');

  // Emulate the screenshot's browser-bar height and physical side/home insets.
  if (inset)
    await page.addStyleTag({
      content: `body:has(#play-area) { padding: 2px ${inset}px 21px !important; }`,
    });
  const before = await frameGeometry(page);

  if (phone) {
    await expect(page.locator('.start-age .age-rating')).toBeInViewport({ ratio: 0.99 });
    await expect(page.locator('.start-age .age-rating')).toContainText('Ab 6 Jahren');
  }

  await page.locator('[data-control="jump"]').tap();
  await until(page, (s) => s.started && s.pixel.grounded);

  if (phone) expect(await frameGeometry(page)).toEqual(before);
}

async function frameGeometry(page: Page) {
  return page.locator('#game, .touch-directions, .touch-actions').evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();

      return { x, y, width, height };
    }),
  );
}

type Bounds = { x: number; y: number; width: number; height: number };

// eslint-disable-next-line max-lines-per-function -- Kompakte Handyansicht und unveränderte Tablet-Seitenleisten prüfen getrennte reale Geometrieverträge.
async function layoutGeometry(
  page: Page,
  height: number,
  room: Bounds,
  left: Bounds,
  right: Bounds,
  inset: number,
) {
  const main = (await page.locator('main').boundingBox())!;
  const menu = (await page.locator('.game-menu-actions').first().boundingBox())!;
  const info = (await page.locator('.mobile-hud').boundingBox())!;

  expect(main.y).toBeGreaterThanOrEqual(0);
  expect(
    Math.max(room.y + room.height, left.y + left.height, right.y + right.height),
  ).toBeLessThanOrEqual(height);

  if (height <= 550) {
    expect(left.x + left.width + 2).toBeLessThanOrEqual(room.x);
    expect(room.x + room.width + 2).toBeLessThanOrEqual(right.x);
    expect(left.x).toBeGreaterThanOrEqual(inset);
    expect(left.x).toBeLessThanOrEqual(inset + 4);
    expect(right.x + right.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - inset - 4);
    expect(info.x).toBeGreaterThanOrEqual(room.x + room.width + 2);
    expect(menu.x).toBeGreaterThanOrEqual(room.x + room.width + 2);
    await expect(page.locator('.pause-toggle')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.album-toggle')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('main > footer')).toBeHidden();
    expect((await state(page)).camera).toEqual({ x: 0, y: 0, width: 960, height: 540, zoom: 1 });
    await largestRoom(page, height, room, left, right);
    await alignedSidebars(page, main, left, right, menu);
    expect(left.width).toEqual(right.width);
    expect(Math.abs(room.x + room.width / 2 - main.x - main.width / 2)).toBeLessThan(1);
  } else {
    const title = (await page.locator('main > header').boundingBox())!;

    expect(main.y).toBeGreaterThan(8);
    expect(Math.abs(main.y - (height - main.y - main.height))).toBeLessThan(2);
    expect(left.x + left.width + 16).toBeLessThanOrEqual(room.x);
    expect(room.x + room.width + 16).toBeLessThanOrEqual(right.x);
    expect(title.x + title.width).toBeLessThanOrEqual(room.x);
    expect(title.y + title.height).toBeLessThanOrEqual(left.y);
    expect(info.x).toBeGreaterThanOrEqual(room.x + room.width);
    expect(info.y + info.height).toBeLessThanOrEqual(right.y);
  }
}

// eslint-disable-next-line max-lines-per-function -- Titel, mittige Steuerung und untere Anzeigen bilden einen gemeinsamen sichtbaren Layoutvertrag.
async function alignedSidebars(
  page: Page,
  main: Bounds,
  left: Bounds,
  right: Bounds,
  menu: Bounds,
) {
  const title = (await page.locator('main > header > div:first-child').boundingBox())!;
  const info = (await page.locator('.mobile-hud').boundingBox())!;
  const middle = main.y + main.height / 2;

  await expect(page.locator('main > header h1')).toBeInViewport({ ratio: 1 });
  expect(Math.abs(title.y - main.y)).toBeLessThan(1);
  expect(Math.abs(left.y + left.height / 2 - middle)).toBeLessThan(1);
  expect(Math.abs(right.y + right.height / 2 - middle)).toBeLessThan(1);
  expect(Math.abs(menu.y + menu.height - main.y - main.height)).toBeLessThan(1);
  expect(title.y + title.height + 2).toBeLessThanOrEqual(left.y);
  expect(Math.abs(info.y - main.y)).toBeLessThan(1);
  expect(info.y + info.height + 2).toBeLessThanOrEqual(right.y);
  expect(right.y + right.height + 2).toBeLessThanOrEqual(menu.y);
}

async function largestRoom(page: Page, height: number, room: Bounds, left: Bounds, right: Bounds) {
  const padding = await page.locator('body').evaluate((node) => {
    const style = getComputedStyle(node);

    return parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  });
  const available = Math.min(right.x - left.x - left.width - 4, ((height - padding) * 16) / 9);

  expect(room.width).toBeGreaterThanOrEqual(available - 4);
}

// eslint-disable-next-line max-lines-per-function -- Quellen, Rechtslinks, Version und Sprachwechsel bleiben über das tatsächlich bediente Menü zugänglich.
async function informationMenu(page: Page) {
  await page.locator('.pause-toggle').tap();
  await page.locator('[data-menu-settings]').tap();
  const menu = page.locator('.pause-menu');

  await menu.locator('[data-menu-information]').tap();
  await expect(menu.locator('.age-rating')).toContainText('Ab 6 Jahren');
  await expect(menu.locator('.build-info')).toContainText("Pixel's World");
  await expect(page.locator('#build-info')).toHaveCount(1);
  await expect(menu.getByRole('link', { name: 'Feedback & Ideen', exact: true })).toHaveAttribute(
    'target',
    '_blank',
  );
  await menu.getByRole('link', { name: 'Impressum', exact: true }).scrollIntoViewIfNeeded();
  await expect(menu.getByRole('link', { name: 'Impressum', exact: true })).toBeInViewport();
  await expect(menu.getByRole('link', { name: 'Datenschutz', exact: true })).toHaveAttribute(
    'href',
    './datenschutz.html',
  );
  await menu.locator('[data-menu-settings]').tap();
  await menu.getByRole('button', { name: 'English', exact: true }).tap();
  await menu.locator('[data-menu-information]').tap();
  await expect(menu.locator('.age-rating')).toContainText('Ages 6');
  await expect(menu.locator('[data-menu-heading]')).toHaveText('About the game');
  await menu.locator('[data-pause-resume]').tap();
  await expect(menu).toBeHidden();
  await expect(page.locator('.pause-toggle')).toBeInViewport({ ratio: 1 });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`Chaosmeldung verschiebt kein Layout ${viewport.width}×${viewport.height} @smoke`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Chaosaktion und Ablauf prüfen dieselbe Geometrie vor, während und nach der Meldung.
  }) => {
    await page.setViewportSize(viewport);
    await startTouch(page);
    await besideCouch(page);
    await until(page, (s) => !s.feedback.text);
    const before = await mobileGeometry(page);

    await until(page, (s) => s.couch.damage === 1);
    await expect(page.locator('.mobile-hud')).toContainText('Kratzen');
    expect(await mobileGeometry(page)).toEqual(before);
    await until(page, (s) => !s.feedback.text);
    expect(await mobileGeometry(page)).toEqual(before);
  });
}

async function mobileGeometry(page: import('@playwright/test').Page) {
  return page
    .locator('.mobile-hud, #game, .touch-directions, .touch-actions')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();

        return { x, y, width, height };
      }),
    );
}

test('Schmales Hochformat: Einführung scrollbar, Start erreichbar und Rotation erhält die Runde', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Einführung, Rotation und Eingabe gehören zu derselben fortgesetzten Runde.
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await loadIntro(page);
  await expect(page.locator('.start-prompt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeVisible();
  expect(
    await page.locator('.start-copy').evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  const touch = await startTouch(page);
  const before = await state(page);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  expect((await state(page)).generation).toBe(before.generation);
  await touch.press('right');
  await page.clock.runFor(200);
  await touch.lift();
  expect((await state(page)).pixel.x).toBeGreaterThan(before.pixel.x);
});
