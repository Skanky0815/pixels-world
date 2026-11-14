/* eslint-disable max-lines-per-function -- Reale Sprünge und lesendes Clock-Polling bleiben als gemeinsame Küchenroute zusammen. */
import { expect } from './support';
import type { Page } from '@playwright/test';
import type { GameTestState } from '../../src/test-state';

export async function observe(page: Page) {
  return page.evaluate(() => window.__pixelTest!);
}

export async function until(page: Page, check: (state: GameTestState) => boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        const snapshot = await observe(page);

        return check(snapshot) ? { matched: true } : { matched: false, snapshot };
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toEqual({ matched: true });
}

export async function move(page: Page, keys: string[], check: (state: GameTestState) => boolean) {
  try {
    for (const key of keys) await page.keyboard.down(key);
    await until(page, check);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

export async function climbToCounter(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 255);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 398) < 2);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 410);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 328) < 2);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 520);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 700);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
}
