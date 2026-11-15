/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect, waitForGame } from '../support/support';
import { observe, until, move, climbToCounter, finishCharm } from './kitchen-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

for (const outcome of ['success', 'failed'] as const)
  test(`Öffentliche Küche: Mülleimerfund nach ${outcome === 'success' ? 'erfolgreicher' : 'gescheiterter'} Versöhnung`, async ({
    page,
  }) => {
    await start(page, 'kitchen&room-seed=pantry-easy-12');
    await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
    await until(page, (s) => s.trashBins[0].state === 'spilled');
    expect((await observe(page)).album.pending).toContain('trash-bin.cream');
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 175);
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    const finished = await observe(page);

    expect(finished.result?.outcome).toBe(outcome);
    expect(finished.album.confirmed.includes('trash-bin.cream')).toBe(outcome === 'success');

    if (outcome === 'failed') await expect(page.locator('.album-banner')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
  });
