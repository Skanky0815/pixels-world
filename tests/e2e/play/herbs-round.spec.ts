/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect, waitForGame } from '../support/support';
import {
  observe,
  until,
  move,
  climbToTableLanding,
  climbFromTableToFridge,
  finishCharm,
} from './kitchen-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

for (const outcome of ['success', 'failed'] as const)
  test(`Küchenkräuter: ${outcome} bestätigt oder verwirft den Fund nach wirklicher Versöhnung`, async ({
    page,
  }) => {
    await start(page, 'kitchen');
    await climbToTableLanding(page);
    await climbFromTableToFridge(page);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 660);
    await until(
      page,
      (s) => s.plants.find((plant) => plant.id.includes('fridge-herb'))?.state === 'tipped',
    );
    const herb = (await observe(page)).plants.find((plant) => plant.id.includes('fridge-herb'))!;
    const entry = `plant.${herb.appearance}`;

    expect((await observe(page)).album.pending).toContain(entry);
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 830);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 860);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    const result = await observe(page);

    expect(result.result?.outcome).toBe(outcome);
    expect(result.album.confirmed.includes(entry)).toBe(outcome === 'success');

    if (outcome === 'failed') {
      expect(result.album.confirmed).toEqual([]);
      await expect(page.locator('.album-banner')).toBeHidden();
    }

    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
  });
