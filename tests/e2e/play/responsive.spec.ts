import { returnToMenu } from '../support/pause-support';
import type { Page } from '@playwright/test';
import { test, expect, loadIntro, state, until, besideCouch } from '../support/support';
import { startTouch } from '../support/touch-support';

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
    const content = (await page.locator('#game-content').boundingBox())!;
    const border = await page.locator('#game').evaluate((node) => {
      const style = getComputedStyle(node);

      return parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    });

    expect(canvas!.width).toBeGreaterThanOrEqual(
      Math.min(viewport.minRoomWidth, ((content.height - border) * 16) / 9) - 1,
    );
    expect(canvas!.width / canvas!.height).toBeCloseTo(16 / 9, 1);
    expect(
      await page.locator('canvas').evaluate((node) => getComputedStyle(node).imageRendering),
    ).toBe('pixelated');
    await expect(page.getByRole('region', { name: 'Spielstatus' })).not.toContainText('CHAOS:');
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
    await expect(page.locator('main > footer .age-rating')).toBeInViewport({ ratio: 0.99 });
    await expect(page.locator('main > footer .age-rating')).toContainText('Ab 6 Jahren');
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

// eslint-disable-next-line max-lines-per-function -- Gemeinsamer Rahmen und verbleibende Raum-/Touch-Flächen werden getrennt geprüft.
async function layoutGeometry(
  page: Page,
  height: number,
  room: Bounds,
  left: Bounds,
  right: Bounds,
  inset: number,
) {
  const content = (await page.locator('#game-content').boundingBox())!;
  const title = (await page.locator('main > header').boundingBox())!;
  const footer = (await page.locator('main > footer').boundingBox())!;

  await expect(page.locator('.pause-toggle')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.album-toggle')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('main > footer')).toBeVisible();
  expect(title.y).toBeGreaterThanOrEqual(0);
  expect(title.y + title.height).toBeLessThanOrEqual(content.y);
  expect(content.y + content.height).toBeLessThanOrEqual(footer.y + 1);
  expect(footer.y + footer.height).toBeLessThanOrEqual(height + 1);
  expect(left.x + left.width + 2).toBeLessThanOrEqual(room.x);
  expect(room.x + room.width + 2).toBeLessThanOrEqual(right.x);
  expect(left.x).toBeGreaterThanOrEqual(inset);
  expect(
    Math.max(room.y + room.height, left.y + left.height, right.y + right.height),
  ).toBeLessThanOrEqual(content.y + content.height + 1);
  expect((await state(page)).camera).toEqual({ x: 0, y: 0, width: 960, height: 540, zoom: 1 });

  if (height <= 550) {
    await largestRoom(content, room, left, right);
    expect(left.width).toEqual(right.width);
    expect(Math.abs(room.x + room.width / 2 - content.x - content.width / 2)).toBeLessThan(1);
  }
}

async function largestRoom(content: Bounds, room: Bounds, left: Bounds, right: Bounds) {
  const available = Math.min(right.x - left.x - left.width - 4, (content.height * 16) / 9);

  expect(room.width).toBeGreaterThanOrEqual(available - 4);
}

// eslint-disable-next-line max-lines-per-function -- Quellen, Rechtslinks, Version und Sprachwechsel bleiben über das tatsächlich bediente Menü zugänglich.
async function informationMenu(page: Page) {
  await page.locator('.pause-toggle').tap();
  await returnToMenu(page);
  await page.locator('[data-menu-settings]').tap();
  const menu = page.locator('.pause-menu');

  await returnToMenu(page);
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
  await returnToMenu(page);
  await menu.locator('[data-menu-settings]').tap();
  await menu.getByRole('button', { name: 'English', exact: true }).tap();
  await returnToMenu(page);
  await menu.locator('[data-menu-information]').tap();
  await expect(menu.locator('.age-rating')).toContainText('Ages 6');
  await expect(menu.locator('[data-menu-heading]')).toHaveText('About the game');
  await returnToMenu(page);
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
    await expect(page.locator('.game-feedback-score')).toContainText('Kratzen');
    expect(await mobileGeometry(page)).toEqual(before);
    await until(page, (s) => !s.feedback.messages.score);
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
  const copy = page.locator('.start-copy');

  await expect(copy.locator('h2')).toBeInViewport({ ratio: 1 });
  // Content may fit completely at 320×568; reserve a separate short viewport for scrolling.
  await page.setViewportSize({ width: 320, height: 400 });
  await page.clock.runFor(100);
  expect(await copy.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await copy.hover();
  await page.mouse.wheel(0, 500);
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return copy.evaluate((node) => node.scrollTop);
      },
      { intervals: [0] },
    )
    .toBeGreaterThan(0);
  await expect(page.locator('.start-prompt')).toBeInViewport({ ratio: 1 });
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
