/* eslint-disable max-lines-per-function -- Echte Tastaturabläufe verbinden Größenwechsel, Sprache, Pause und lesbare Phasen ohne Zustandssetter. */
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { test, expect, start, state, until, holdUntil, reset } from './support';
import { useIdleFrames, advanceRoundTo } from './round-clock';
import { changeLanguage } from './pause-support';

const keys = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

test.use({ hasTouch: false, isMobile: false });

async function press(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  await page.keyboard.up(key);
}

async function readable(page: Page) {
  await expect(page.locator('.touch-controls')).toBeHidden();
  await expect(page.locator('.mobile-hud')).toBeVisible();
  await expect(page.locator('.mobile-hud')).toBeInViewport();
  expect(
    await page.locator('.mobile-hud').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(14);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await page.locator('#game').boundingBox())!;

  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

async function visibleRoomBelowDialogue(page: Page) {
  const canvas = (await page.locator('canvas').boundingBox())!;
  const image = PNG.sync.read(await page.screenshot());
  const colors = new Set<string>();

  for (let y = Math.ceil(canvas.y + canvas.height - 50); y < canvas.y + canvas.height - 4; y += 3) {
    for (let x = Math.ceil(canvas.x + 4); x < canvas.x + canvas.width - 4; x += 3) {
      const index = (y * image.width + x) * 4;

      colors.add(`${image.data[index]},${image.data[index + 1]},${image.data[index + 2]}`);
    }
  }

  expect(
    colors.size,
    'Der sichtbare Raum darf unter dem DOM-Dialog nicht schwarz bleiben',
  ).toBeGreaterThan(8);
}

async function rejectHeart(page: Page) {
  await press(page, 'Space');
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  const expected = (await state(page)).reconciliation.expected;

  await press(page, expected === 'left' ? keys.right : keys.left);
}

test(
  'Schmales Mausfenster: lesbare Dialoge, Charme und Ergebnis; Vergrößern zeigt Canvas-Texte einmal',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await start(page, '/?camera=room&round-profile=fast');
    await readable(page);
    await expect(page.locator('.mobile-goal')).toHaveCount(0);
    await expect(page.locator('.mobile-hud')).toContainText('CHAOS:');
    await useIdleFrames(page);
    await advanceRoundTo(page, (await state(page)).round.returnAtMs);
    await until(
      page,
      (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
      500,
    );
    await expect(page.locator('.mobile-dialogue')).toBeVisible();
    expect((await state(page)).sara.canvasTextVisible).toBe(false);
    const generation = (await state(page)).generation;

    for (const width of [1280, 1024, 568]) {
      await page.setViewportSize({ width, height: 720 });
      await page.clock.runFor(100);
      await expect(page.locator('.mobile-dialogue')).toBeVisible({ visible: width <= 1024 });
      await until(page, (s) => s.sara.canvasTextVisible === width > 1024, 100);
      expect((await state(page)).generation).toBe(generation);
      await expect(page.locator('.touch-controls')).toBeHidden();
    }

    await page.setViewportSize({ width: 568, height: 320 });
    await changeLanguage(page, 'en');
    await expect(page.locator('.mobile-dialogue')).toBeVisible();
    await expect(page.locator('.mobile-hint')).toContainText('␣:');
    await visibleRoomBelowDialogue(page);
    await test.info().attach('schmales-mausfenster-dialog', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await press(page, 'Space');
    await until(page, (s) => s.reconciliation.stage === 'reading', 100);
    expect((await state(page)).charmDisplay.canvasTextVisible).toBe(false);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.runFor(100);
    await until(page, (s) => s.charmDisplay.canvasTextVisible, 100);
    await expect(page.locator('.mobile-dialogue')).toBeHidden();
    await page.setViewportSize({ width: 568, height: 320 });
    await page.clock.runFor(100);
    await rejectHeart(page);
    await rejectHeart(page);
    await until(page, (s) => s.result !== null, 100);
    await expect(page.locator('.mobile-result')).toBeVisible();
    expect((await state(page)).result?.canvasTextVisible).toBe(false);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.runFor(100);
    await until(page, (s) => s.result?.canvasTextVisible === true, 100);
    await expect(page.locator('.mobile-dialogue')).toBeHidden();
  },
);

test('Schmales Hochformat ohne Touch: HUD bleibt lesbar, Tastatur und Neustart bleiben bedienbar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, '/?camera=room');
  await readable(page);
  const initial = await state(page);

  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x > initial.pixel.x + 30);
  await holdUntil(page, ['Space'], (s) => !s.pixel.grounded);
  await until(page, (s) => s.pixel.grounded);
  await reset(page);
  await readable(page);
  await expect(page.locator('.mobile-hud')).toHaveCount(1);
  await expect(page.locator('.mobile-dialogue')).toHaveCount(1);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.runFor(100);
  await expect(page.locator('.mobile-hud')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await readable(page);
});
