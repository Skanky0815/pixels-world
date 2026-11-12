import { test, expect, loadIntro, until, state, framesPass, curtain, holdUntil } from './support';
import { TouchDriver } from './touch-support';
import type { Page } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true });

for (const viewport of [
  { width: 568, height: 320, room: 'living-room' },
  { width: 844, height: 330, room: 'living-room' },
  { width: 568, height: 320, room: 'cozy-remix' },
  { width: 844, height: 330, room: 'cozy-remix' },
]) {
  test(`Kameraversuch ${viewport.room} mit Touch ${viewport.width}×${viewport.height}`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Reale Touchbewegung prüft Flächennutzung, Kamerafolge und den weiterhin erreichbaren Pausendialog gemeinsam.
  }) => {
    await page.setViewportSize(viewport);
    await cameraStart(page, viewport.room);
    const before = (await state(page)).camera;
    const touch = await TouchDriver.create(page);

    await touch.press('right');
    await until(page, (s) => s.pixel.x > 475);
    await touch.lift();
    await framesPass(page);
    const after = await state(page);

    expect(after.camera.zoom).toBe(2);
    expect(after.camera.x).toBeGreaterThan(before.x + 50);
    expect(after.pixel.x - after.camera.x).toBeCloseTo(after.camera.width / 2, -1);
    await fillsViewport(page);
    await bottomControls(page);
    await page.locator('.pause-toggle').tap();
    await expect(page.locator('.pause-menu')).toBeVisible();
    await page.locator('[data-pause-resume]').tap();
    await expect(page.locator('.pause-menu')).toBeHidden();
    await cannotHide(page, touch);
  });
}

// eslint-disable-next-line max-lines-per-function -- Vorhang, Kameragrenzen und Rotation werden ohne Szenenmanipulation in derselben echten Runde geprüft.
test('Kameraversuch: Vorhang und Rotation behalten Runde und Raumgrenzen', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 330 });
  await cameraStart(page);
  await curtain(page);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.y < 280);
  const before = await state(page);
  const camera = before.camera;
  const left = camera.x + (camera.width - camera.width / camera.zoom) / 2;
  const top = camera.y + (camera.height - camera.height / camera.zoom) / 2;

  expect(left).toBeGreaterThanOrEqual(-481);
  expect(left + camera.width / camera.zoom).toBeLessThanOrEqual(1441);
  expect(top).toBeGreaterThanOrEqual(-1);
  expect(top + camera.height / camera.zoom).toBeLessThanOrEqual(541);
  await page.setViewportSize({ width: 390, height: 844 });
  await until(page, (s) => s.camera.zoom === 1 && s.camera.width === 960);
  expect((await state(page)).started).toBe(true);
  await page.setViewportSize({ width: 844, height: 330 });
  await until(page, (s) => s.camera.zoom === 2);
  await fillsViewport(page);
});

async function cameraStart(page: Page, room = 'living-room') {
  await loadIntro(page, `/?room=${room}`);
  await page.locator('[data-control="jump"]').tap();
  await until(page, (s) => s.started && s.pixel.grounded);
}

async function fillsViewport(page: Page) {
  const main = (await page.locator('main').boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;

  expect(Math.abs(canvas.width - main.width)).toBeLessThan(2);
  expect(Math.abs(canvas.height - main.height)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('[data-control="left"]')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('[data-control="jump"]')).toBeInViewport({ ratio: 1 });
}

async function bottomControls(page: Page) {
  const main = (await page.locator('main').boundingBox())!;

  for (const selector of ['.touch-directions', '.touch-actions']) {
    const buttons = (await page.locator(selector).boundingBox())!;

    expect(Math.abs(main.y + main.height - buttons.y - buttons.height - 8)).toBeLessThan(1);
  }
}

// eslint-disable-next-line max-lines-per-function -- Reale Touchbewegung läuft bis zur ursprünglichen Raumgrenze und prüft anschließend die freie Sicht auf Pixel.
async function cannotHide(page: Page, touch: TouchDriver) {
  for (const direction of ['left', 'right'] as const) {
    await touch.press(direction);
    await until(page, (s) =>
      direction === 'left' ? s.pixel.left < 0.1 : s.pixel.left + s.pixel.bodyWidth > 959.9,
    );
    await touch.lift();
    await framesPass(page);
    await clearOfControl(page, direction);
  }
}

// eslint-disable-next-line max-lines-per-function -- Projiziert die normale 64-Pixel-Figur aus dem unveränderlichen Snapshot auf die tatsächlichen Touch-Flächen.
async function clearOfControl(page: Page, direction: 'left' | 'right') {
  const { camera, pixel } = await state(page);
  const canvas = (await page.locator('canvas').boundingBox())!;
  const controls = (await page
    .locator(direction === 'left' ? '.touch-directions' : '.touch-actions')
    .boundingBox())!;
  const center = (pixel.x - camera.x - camera.width / 2) * camera.zoom + camera.width / 2;
  const left = canvas.x + ((center - 32 * camera.zoom) / camera.width) * canvas.width;
  const right = canvas.x + ((center + 32 * camera.zoom) / camera.width) * canvas.width;

  expect(pixel.velocityX).toBe(0);

  if (direction === 'left') expect(pixel.left).toBeCloseTo(0, 0);
  else expect(pixel.left + pixel.bodyWidth).toBeCloseTo(960, 0);

  const gap = direction === 'left' ? left - controls.x - controls.width : controls.x - right;

  expect(gap).toBeGreaterThanOrEqual(2);
  expect(gap).toBeLessThanOrEqual(8);
}
