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

for (const [appearance, difficulty, seed] of [
  ['jar', 'normal', 'fridge-front-normal-5'],
  ['tin', 'easy', 'pantry-easy-1'],
] as const)
  for (const outcome of ['success', 'failed'] as const)
    test(`${appearance}: ${outcome} bestätigt oder verwirft den Behälterfund nach wirklicher Versöhnung`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem('pixels-world.difficulty', value),
        difficulty,
      );
      await start(page, `kitchen&room-seed=${seed}`);
      await climbToTableLanding(page);

      if (appearance === 'tin') await climbFromTableToFridge(page);
      const target = (await observe(page)).pantry.find(
        (item) =>
          item.id ===
          (appearance === 'jar' ? 'kitchen-table:table-1' : 'kitchen-fridge:fridge-tin'),
      )!;

      expect(target.appearance).toBe(appearance);
      await move(
        page,
        ['ArrowRight'],
        (s) => s.pantry.find((item) => item.id === target.id)?.state === 'moving',
      );
      await until(page, (s) => s.pantry.find((item) => item.id === target.id)?.events === 1);
      expect((await observe(page)).album.pending).toContain(`pantry.${appearance}`);

      if (appearance === 'jar') await climbFromTableToFridge(page);
      await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 830);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
      const x = (await observe(page)).pixel.x;

      await move(
        page,
        [x < 860 ? 'ArrowRight' : 'ArrowLeft'],
        (s) => Math.abs(s.pixel.x - 860) < 4,
      );
      await until(
        page,
        (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
      );
      expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
      await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
      await finishCharm(page, outcome === 'success');
      await until(page, (s) => s.result !== null);
      const result = await observe(page);

      expect(result.result?.outcome).toBe(outcome);
      expect(result.album.confirmed.includes(`pantry.${appearance}`)).toBe(outcome === 'success');

      if (outcome === 'failed') {
        expect(result.album.confirmed).toEqual([]);
        await expect(page.locator('.album-banner')).toBeHidden();
      }

      expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
      expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
    });
