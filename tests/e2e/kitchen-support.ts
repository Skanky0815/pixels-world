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

export async function climbToTableLanding(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 255);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 398) < 2);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 410);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 328) < 2);
}

export async function climbFromTableToFridge(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 581);
  await move(page, ['ArrowUp'], (s) => s.pixel.bottom <= 170);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 688);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 148) < 2);
}

export async function climbToCounterLanding(page: Page) {
  await climbToTableLanding(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 450);
  const snapshot = await observe(page);
  const hasFridge = snapshot.room.width === 960 && snapshot.shelves.some((shelf) => shelf.isFridge);

  if (hasFridge) {
    await climbFromTableToFridge(page);
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 830);
  } else await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 675);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
}

export async function climbToCounter(page: Page) {
  await climbToCounterLanding(page);

  if ((await observe(page)).pixel.x < 800) {
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 800);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
  }

  const x = (await observe(page)).pixel.x;

  await move(page, [x < 860 ? 'ArrowRight' : 'ArrowLeft'], (s) => Math.abs(s.pixel.x - 860) < 4);
}

async function pressCharmArrow(page: Page, input: GameTestState['reconciliation']) {
  if (!input.expected) throw new Error('Sichtbarer Pfeil fehlt');
  const arrow = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }[
    input.expected
  ];

  await move(
    page,
    [arrow],
    (s) => s.reconciliation.stage !== 'input' || s.reconciliation.step > input.step,
  );
}

export async function finishCharm(page: Page, success: boolean) {
  while (!['complete', 'failed'].includes((await observe(page)).reconciliation.stage)) {
    const input = (await observe(page)).reconciliation;

    if (input.stage === 'reading' || input.stage === 'feedback')
      await move(page, ['Space'], (s) => s.reconciliation.stage === 'cue');
    else if (input.stage === 'cue') await until(page, (s) => s.reconciliation.stage === 'input');
    else if (input.stage === 'input') {
      if (!success) await page.clock.runFor(input.inputMs + 32);
      else {
        await pressCharmArrow(page, input);
      }
    } else await until(page, (s) => s.reconciliation.stage === 'complete');
  }
}
