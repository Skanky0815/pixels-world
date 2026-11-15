/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect, waitForGame } from '../support/support';
import type { Page } from '@playwright/test';
import { observe, until, move, climbToCounter, finishCharm } from './kitchen-support';

async function start(page: Page, room = 'kitchen-preview') {
  await page.goto(`/play.html?scenario=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

for (const outcome of ['success', 'failed'] as const)
  test(`Beutelschaden verhindert friedlichen Abschluss; ${outcome} bestätigt oder verwirft Napf- und Beutelfund gemeinsam`, async ({
    page,
  }) => {
    await start(page);
    await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'spilled');
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 110);
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    const home = await observe(page);

    expect(home.homecoming.selection?.peaceful).toBe(false);
    expect(home.album.pending).toEqual(expect.arrayContaining(['food-bag.dry', 'goal.food-bowl']));
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    expect((await observe(page)).result?.peaceful).toBe(false);
    expect((await observe(page)).result?.outcome).toBe(outcome);

    if (outcome === 'success')
      expect((await observe(page)).album.confirmed).toEqual(
        expect.arrayContaining(['food-bag.dry', 'goal.food-bowl']),
      );
    else {
      expect((await observe(page)).album.confirmed).toEqual([]);
      await expect(page.locator('.album-banner')).toBeHidden();
    }

    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
  });
