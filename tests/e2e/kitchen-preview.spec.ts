/* eslint-disable max-lines-per-function -- Die echte Sprungroute prüft alle Auflagen, Pause und Reset als zusammenhängenden Raumablauf. */
import { test, expect, waitForGame, waitForLoadingScreen } from './support';
import type { Page } from '@playwright/test';
import type { GameTestState } from '../../src/test-state';

async function observe(page: Page) {
  return page.evaluate(() => window.__pixelTest!);
}

async function until(page: Page, check: (state: GameTestState) => boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return check(await observe(page));
      },
      { intervals: [0] },
    )
    .toBe(true);
}

async function move(page: Page, keys: string[], check: (state: GameTestState) => boolean) {
  try {
    for (const key of keys) await page.keyboard.down(key);
    await until(page, check);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

for (const [difficulty, viewport] of [
  ['easy', { width: 1280, height: 900 }],
  ['normal', { width: 390, height: 844 }],
  ['hard', { width: 568, height: 320 }],
] as const) {
  test.describe(`Küchen-Grundraum ${difficulty}`, () => {
    test.use({ viewport });
    test(
      'Hocker, Tisch und Arbeitsplatte sind friedlich erreichbar; Pause und Reset erhalten die Geometrie',
      { tag: '@smoke' },
      async ({ page }, info) => {
        await page.addInitScript(
          (value) => localStorage.setItem('pixels-world.difficulty', value),
          difficulty,
        );
        await page.goto('/play.html?room=kitchen-preview');
        await waitForGame(page);
        await page.keyboard.down('Space');
        await until(page, (s) => s.started && s.pixel.grounded);
        await page.keyboard.up('Space');
        expect((await observe(page)).room.id).toBe('kitchen-preview');
        await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 255);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 398) < 2);
        await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 410);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 328) < 2);
        await move(page, ['ArrowRight'], (s) => s.pixel.x >= 520);
        await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 700);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
        const reached = await observe(page);

        expect(reached.chaos.score).toBe(0);
        expect(
          reached.shelves.every((s) => s.enabled && s.damage === 0 && s.stability === 'stable'),
        ).toBe(true);
        await info.attach('kuechen-grundraum', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
        await page.keyboard.press('Escape');
        const paused = await observe(page);

        await page.clock.runFor(1000);
        expect((await observe(page)).round).toEqual(paused.round);
        await page.locator('[data-pause-resume]').click();
        await move(page, ['r'], (s) => s.generation > reached.generation);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
        expect((await observe(page)).pixel.x).toBe(110);
        expect((await observe(page)).shelves.every((s) => s.enabled && s.damage === 0)).toBe(true);
      },
    );
  });
}

test('Produktion ignoriert die Küchenvorschau und lässt die öffentliche Küche gesperrt', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4175/pixels-world/play.html?room=kitchen-preview');
  await waitForLoadingScreen(page);
  await expect(page.locator('h1 span').first()).toContainText('WOHNZIMMER');
  await page.locator('[data-menu-play]').click();
  await expect(page.locator('.room-choice').filter({ hasText: 'Küche' })).toBeDisabled();
  expect(await page.evaluate(() => typeof window.__pixelTest)).toBe('undefined');
});
