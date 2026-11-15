import type { Page } from '@playwright/test';
import { state, until } from './support';

/** Seed the browser boundary before startup, without exposing or setting game state. */
export async function seedRoundRandom(page: Page) {
  await page.addInitScript(() => {
    let seed = 91;

    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;

      return seed / 4294967296;
    };
  });
}

/** The long lifecycle uses 10 Hz after setup; other browser scenarios retain normal RAF. */
export async function useIdleFrames(page: Page) {
  await page.evaluate(() => {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  });
}

export async function advanceRoundTo(page: Page, elapsedMs: number) {
  const before = await state(page);

  await page.clock.runFor(Math.max(0, elapsedMs - before.round.elapsedMs));
  // Phaser smooths frame deltas; observe the milestone rather than assuming wall time equals game time.
  await until(page, (snapshot) => snapshot.round.elapsedMs >= elapsedMs);
}
