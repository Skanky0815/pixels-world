/* eslint-disable max-lines-per-function -- Zusammenhängende Tablet-Szenarien und ihre Geometrieprüfung bleiben als vollständige Nutzerabläufe lesbar. */
import type { Page } from '@playwright/test';
import { test, expect, loadIntro, state, until, reset } from './support';

async function startTablet(page: Page) {
  await loadIntro(page);
  await page.locator('[data-control="jump"]').tap();
  await until(page, (s) => s.started && s.pixel.grounded);
}

async function bounds(page: Page, selector: string) {
  const rect = await page.locator(selector).boundingBox();

  expect(rect).not.toBeNull();

  if (!rect) throw new Error(`Sichtbare Fläche fehlt: ${selector}`);

  return rect;
}

async function waitForCanvasFit(page: Page) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return page.evaluate(() => {
          const host = document.querySelector<HTMLElement>('#game')!;
          const room = host.getBoundingClientRect();
          const canvas = document.querySelector('canvas')!.getBoundingClientRect();

          const fit =
            canvas.width >= Math.min(host.clientWidth, (host.clientHeight * 16) / 9) - 2 &&
            canvas.width <= room.width + 4 &&
            canvas.top >= room.top - 4 &&
            canvas.bottom <= room.bottom + 4 &&
            canvas.left >= room.left - 4 &&
            canvas.right <= room.right + 4;

          return { fit, room: room.toJSON(), canvas: canvas.toJSON() };
        });
      },
      { intervals: [0] },
    )
    .toMatchObject({ fit: true });
}

async function tabletGeometry(page: Page, landscape: boolean) {
  await waitForCanvasFit(page);
  const room = await bounds(page, '#game');
  const left = await bounds(page, '.touch-directions');
  const right = await bounds(page, '.touch-actions');
  const canvas = await bounds(page, 'canvas');
  const jump = await bounds(page, '[data-control="jump"]');
  const direction = await bounds(page, '[data-control="right"]');

  expect(direction.width).toBeGreaterThanOrEqual(56);
  expect(direction.height).toBeGreaterThanOrEqual(56);
  expect(jump.height).toBeGreaterThanOrEqual(56);
  expect(canvas.width / canvas.height).toBeCloseTo(16 / 9, 1);
  expect(canvas.width).toBeLessThanOrEqual(room.width + 4);
  expect(canvas.x).toBeGreaterThanOrEqual(room.x - 4);
  expect(canvas.x + canvas.width).toBeLessThanOrEqual(room.x + room.width + 4);
  expect(canvas.y).toBeGreaterThanOrEqual(room.y - 4);
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(room.y + room.height + 4);
  expect((await state(page)).camera).toEqual({ x: 0, y: 0, width: 960, height: 540, zoom: 1 });
  expect(await page.locator('canvas').evaluate((n) => getComputedStyle(n).imageRendering)).toBe(
    'pixelated',
  );
  await expect(page.locator('.mobile-hud')).toBeVisible();
  expect((await state(page)).charmDisplay.canvasTextVisible).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  if (landscape) {
    expect(left.x + left.width + 16).toBeLessThanOrEqual(room.x);
    expect(room.x + room.width + 16).toBeLessThanOrEqual(right.x);
  } else {
    expect(left.y).toBeGreaterThanOrEqual(room.y + room.height);
    expect(right.y).toBeGreaterThanOrEqual(room.y + room.height);
  }

  for (const rect of [room, left, right]) {
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
}

async function tabletMenu(page: Page) {
  await page.locator('.pause-toggle').tap();
  await page.locator('[data-menu-settings]').tap();
  const menu = await bounds(page, '.pause-menu');

  expect(menu.y).toBeGreaterThanOrEqual(0);
  expect(menu.x + menu.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.locator('[data-pause-resume]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-pause-resume]')).toBeInViewport();
  await page.locator('[data-pause-resume]').tap();
}

test.describe('Tablet-Touch-Oberfläche', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 1366, height: 1024 },
    { width: 1280, height: 800 },
  ]) {
    test(`Tablet ${viewport.width}×${viewport.height}: große Tasten, Rotation und Reset @smoke`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await startTablet(page);
      const before = await state(page);

      await tabletGeometry(page, true);
      await tabletMenu(page);
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await page.clock.runFor(64);
      await tabletGeometry(page, false);
      await tabletMenu(page);
      await test
        .info()
        .attach('tablet-hochformat', { body: await page.screenshot(), contentType: 'image/png' });
      expect((await state(page)).generation).toBe(before.generation);
      expect((await state(page)).goal).toEqual(before.goal);
      await page.locator('[data-control="jump"]').tap();
      await until(page, (s) => !s.pixel.grounded);
      await until(page, (s) => s.pixel.grounded);
      await reset(page);
      await tabletGeometry(page, false);
      await page.setViewportSize(viewport);
      await page.clock.runFor(64);
      await tabletGeometry(page, true);
      await test
        .info()
        .attach('tablet-querformat', { body: await page.screenshot(), contentType: 'image/png' });
      await page.setViewportSize({ width: 390, height: 844 });
      const phone = await bounds(page, '[data-control="right"]');

      expect(phone.width).toBe(48);
      expect(phone.height).toBe(48);
    });
  }
});

test.describe('Hybrid-Gerät', () => {
  test.use({ hasTouch: true, isMobile: false, viewport: { width: 1440, height: 900 } });

  test('Breiter Touch-Laptop behält Touch-HUD und Tastaturbedienung', async ({ page }) => {
    await startTablet(page);
    await tabletGeometry(page, true);
    const before = await state(page);

    await page.keyboard.down('ArrowRight');
    await until(page, (s) => s.pixel.x > before.pixel.x + 30);
    await page.keyboard.up('ArrowRight');
    await page.locator('[data-control="jump"]').click();
    await until(page, (s) => !s.pixel.grounded);
    await tabletGeometry(page, true);
    expect((await state(page)).generation).toBe(before.generation);
  });
});

test.describe('Desktop ohne Touch', () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1366, height: 1024 } });

  test('Maus-Desktop bleibt ohne Touch-Seitenleisten', async ({ page }) => {
    await loadIntro(page);
    await expect(page.locator('.touch-controls')).toBeHidden();
    await expect(page.locator('.mobile-hud')).toBeHidden();
    await page.keyboard.down('Space');
    await until(page, (s) => s.started);
    await page.keyboard.up('Space');
    await expect(page.locator('.mobile-hud')).toBeVisible();
    await page.keyboard.down('ArrowRight');
    await until(page, (s) => s.pixel.x > 140);
    await page.keyboard.up('ArrowRight');
  });
});
