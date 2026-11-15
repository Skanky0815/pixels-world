/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect, waitForGame } from '../support/support';
import { observe, until, move, climbToCounterLanding, finishCharm } from './kitchen-support';
import type { Page } from '@playwright/test';
import type { GameTestState } from '../../../game/play/test-state';

async function enter(page: Page) {
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await grabHandle(page);
  const hanging = await observe(page);

  expect(fridge(hanging).fridge?.state).toBe('hanging');
  expect(hanging.pixel.visible).toBe(true);
  expect(hanging.pixel.visualFrame).toBe(15);
  await page.clock.runFor(200);
  expect((await observe(page)).pixel.x).toBeCloseTo(hanging.pixel.x, 1);
  await until(page, (s) => fridge(s).fridge?.state === 'opening');
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge?.texture).toBe('fridge-ajar');
  await until(page, (s) => fridge(s).fridge?.state === 'entering');
  expect((await observe(page)).pixel.visible).toBe(false);
  await until(page, (s) => fridge(s).fridge?.state === 'inside');
}

async function waitForRemaining(page: Page, remaining: number) {
  // Phaser smooths frame deltas: approach the observed active time in bounded steps.
  for (let step = 0; step < 500; step++) {
    const { round } = await observe(page);
    const gap = round.returnAtMs - round.elapsedMs - remaining;

    if (gap <= 0) {
      expect(round.phase).toBe('chaos');

      return;
    }

    await page.clock.runFor(Math.min(500, Math.max(16, Math.floor(gap / 2))));
  }

  throw new Error('Aktive Küchen-Restzeit wurde nicht erreicht');
}

async function descendFromSourceShelf(page: Page) {
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 870);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
}

async function grabHandle(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => fridge(s).fridge?.state === 'hanging');
}

async function start(page: Page, room = 'fridge-visit') {
  const parameter = room.startsWith('kitchen') ? 'room' : 'scenario';

  await page.goto(`/play.html?${parameter}=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

const fridge = (s: GameTestState) => s.shelves.find((p) => p.isFridge)!;

test('Heimkehr bricht den Besuch nach Fremdschaden ab, ohne Türöffnung oder zweite Wertung', async ({
  page,
}) => {
  await start(page, 'fridge-incoming');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].x > 1018);
  await until(page, (s) => fridge(s).fridge?.events === 1);
  await descendFromSourceShelf(page);
  const damaged = await observe(page);

  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await waitForRemaining(page, 350);
  await grabHandle(page);
  await until(page, (s) => s.round.phase !== 'chaos');
  const homecoming = await observe(page);

  expect(homecoming.pixel.visible).toBe(true);
  expect(fridge(homecoming).fridge).toMatchObject({
    state: 'idle',
    doorState: 'closed',
    events: 1,
    captured: false,
  });
  expect(homecoming.chaos.score).toBe(damaged.chaos.score);
  expect(homecoming.album.pending).toEqual(damaged.album.pending);
});

for (const success of [true, false])
  test(`Küchenrunde bestätigt den Kühlschrankfund nur bei ${success ? 'erfolgreicher' : 'gescheiterter'} Versöhnung`, async ({
    page,
  }) => {
    await start(page);
    await enter(page);
    await until(page, (s) => fridge(s).fridge?.state === 'open');
    // Walk left beneath the existing route; the static counter requires jumping back onto its top.
    await move(page, ['ArrowUp'], (s) => s.pixel.climbing);
    await move(page, ['ArrowUp'], (s) => s.pixel.bottom <= 170);
    await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x < 930);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
    const x = (await observe(page)).pixel.x;

    await move(page, [x < 860 ? 'ArrowRight' : 'ArrowLeft'], (s) => Math.abs(s.pixel.x - 860) < 4);
    await until(page, (s) => s.round.phase !== 'chaos');
    await until(page, (s) => s.pixelReturn.stage === 'seated');
    await move(page, ['Space'], (s) => s.round.phase === 'reconciliation');
    await finishCharm(page, success);
    await until(page, (s) => Boolean(s.result));
    expect((await observe(page)).album.confirmed.includes('fridge.cream')).toBe(success);
  });

for (const [phase, remaining] of [
  ['hanging', 350],
  ['opening', 900],
  ['entering', 1350],
  ['inside', 1600],
  ['reopening', 3000],
] as const)
  test(`Timerende während ${phase} gibt Pixel für Saras Heimkehr frei, ohne Schaden zu erfinden`, async ({
    page,
  }) => {
    await start(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
    await waitForRemaining(page, remaining);
    await grabHandle(page);
    await until(page, (s) => fridge(s).fridge?.state === phase);
    expect((await observe(page)).pixel.visible).toBe(['hanging', 'opening'].includes(phase));
    await until(page, (s) => s.round.phase !== 'chaos');
    expect((await observe(page)).pixel.visible).toBe(true);
    expect(fridge(await observe(page)).fridge?.state).toBe('idle');
    expect((await observe(page)).chaos.score).toBe(0);
    expect((await observe(page)).album.pending).not.toContain('fridge.cream');
  });

test('Öffentliche Raumauswahl übernimmt die Küche und stellt beim Rückwechsel die Wohnzimmerbreite wieder her', async ({
  page,
}) => {
  await page.goto('/play.html?scenario=fridge-visit&camera=room');
  await waitForGame(page);
  expect((await observe(page)).room.physicsWidth).toBe(1320);
  await page.locator('[data-start-rooms]').click();
  await until(page, (s) => !s.intro.visible);
  await page.locator('[data-room-choice="kitchen"]').click();
  await page.locator('[data-room-start="kitchen"]').click();
  await until(page, (s) => s.room.id === 'kitchen' && s.camera.width === 960);
  await waitForGame(page, false);
  await expect(page.locator('#game')).toHaveAttribute('data-room-width', '960');
  expect((await observe(page)).room.physicsWidth).toBe(960);
  await page.locator('[data-start-rooms]').click();
  await until(page, (s) => !s.intro.visible);
  await page.locator('[data-room-choice="living-room"]').click();
  await page.locator('[data-room-start="living-room"]').click();
  await until(page, (s) => s.room.id === 'living-room' && s.camera.width === 960);
  await expect(page.locator('#game')).toHaveAttribute('data-room-width', '960');
  expect((await observe(page)).room.physicsWidth).toBe(960);
});

test('Öffentliche Küche: über den Kühlschrank hin und vor dem Napf wieder zurück zum Eingang ohne Softlock @smoke', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('pixels-world.difficulty', 'easy'));
  await start(page, 'kitchen&room-seed=pantry-easy-1');
  await climbToCounterLanding(page);
  expect((await observe(page)).round.phase).toBe('chaos');
  expect((await observe(page)).chaos.score).toBe(0);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 795);
  await move(page, ['ArrowUp'], (s) => s.pixel.bottom <= 170);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 688);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 148) < 2);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 440);
  await until(page, (s) => s.pixel.grounded);
  await move(
    page,
    ['ArrowLeft'],
    (s) => s.pixel.x <= 178 && s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2,
  );
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge?.hidden).toBe(false);
  expect((await observe(page)).round.phase).toBe('chaos');
});
