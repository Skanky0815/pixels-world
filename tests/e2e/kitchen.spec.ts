/* eslint-disable max-lines-per-function -- Eine öffentliche Küchenrunde verbindet drei Aktionen mit Pause, Versöhnung, Album und anschließendem Reset. */
import { test, expect, waitForGame } from './support';
import {
  observe,
  until,
  move,
  climbToTableLanding,
  climbToCounter,
  finishCharm,
} from './kitchen-support';
import type { GameTestState } from '../../src/test-state';

const fridgeState = (s: GameTestState) => s.shelves.find((shelf) => shelf.isFridge)!.fridge!;

test('Küchenabschluss: Beutel, Mülleimer und Kühlschrank teilen Pause, Wertung, Versöhnung und Reset @smoke', async ({
  page,
}) => {
  await page.goto('/play.html?room=kitchen&camera=room&room-seed=pantry-normal-15');
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
  await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'falling');
  await until(page, (s) => s.foodBags[0].state === 'spilled');
  await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
  await until(page, (s) => s.trashBins[0].state === 'spilled');
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 110);
  await climbToTableLanding(page);

  for (const bumps of [1, 2]) {
    await move(page, ['Space', 'ArrowRight'], (s) => fridgeState(s).bumps === bumps);

    if (bumps === 1) await until(page, (s) => s.pixel.grounded);
  }

  await until(page, (s) => fridgeState(s).state === 'open');
  const damaged = await observe(page);

  expect(damaged.foodBags[0].events).toBe(1);
  expect(damaged.trashBins[0].events).toBe(1);
  expect(fridgeState(damaged).events).toBe(1);

  for (const entry of ['food-bag.dry', 'trash-bin.cream', 'fridge.cream'])
    expect(damaged.album.pending).toContain(entry);
  await page.keyboard.press('Escape');
  const paused = await observe(page);

  await page.clock.runFor(1500);
  expect((await observe(page)).chaos).toEqual(paused.chaos);
  expect((await observe(page)).round).toEqual(paused.round);
  await page.locator('[data-pause-resume]').click();
  await until(page, (s) => s.pixel.grounded);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 110);
  await climbToCounter(page);
  await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
  expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
  await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
  await finishCharm(page, true);
  await until(page, (s) => s.result !== null);
  const finished = await observe(page);

  expect(finished.result?.outcome).toBe('success');

  for (const entry of ['food-bag.dry', 'trash-bin.cream', 'fridge.cream', 'goal.food-bowl'])
    expect(finished.album.confirmed).toContain(entry);
  await move(page, ['r'], (s) => s.generation > finished.generation);
  const reset = await observe(page);

  expect(reset.chaos.score).toBe(0);
  expect(reset.foodBags[0].state).toBe('upright');
  expect(reset.trashBins[0].state).toBe('upright');
  expect(fridgeState(reset)).toMatchObject({
    state: 'idle',
    captured: false,
    events: 0,
  });
  expect(reset.album.pending).toEqual([]);
  expect(reset.album.confirmed).toEqual([]);
  await page.locator('.album-toggle').click();
  await expect(page.locator('.album-overall')).toContainText(
    `Insgesamt: ${finished.album.confirmed.length} von`,
  );
  expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
});
