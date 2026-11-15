/* eslint-disable max-lines-per-function -- Echte Eingaben und Lebenszyklusgrenzen bleiben als vollständige Spielabläufe nachvollziehbar. */
import { test, expect, waitForGame } from './support';
import { observe, until, move, climbToCounterLanding, finishCharm } from './kitchen-support';
import { TouchDriver } from './touch-support';
import type { Page } from '@playwright/test';
import type { GameTestState } from '../../src/test-state';
const fridge = (s: GameTestState) => s.shelves.find((p) => p.isFridge)!;

async function start(page: Page, room = 'fridge-visit') {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

async function jumpAgainst(page: Page, count: number) {
  await move(page, ['Space', 'ArrowRight'], (s) => (fridge(s).fridge?.bumps ?? 0) >= count);
}

async function enter(page: Page) {
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await jumpAgainst(page, 1);
  await until(page, (s) => s.pixel.grounded);
  await jumpAgainst(page, 2);
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

test('Pixel hängt an der Klinke, zieht die Tür auf und verschwindet erst danach; Innenchaos bleibt @smoke', async ({
  page,
}) => {
  await start(page);
  await enter(page);
  const hidden = await observe(page);

  expect(hidden.pixel.visible).toBe(false);
  expect(fridge(hidden).fridge).toMatchObject({
    doorState: 'closed',
    texture: 'fridge-upright',
    displayWidth: 160,
    displayHeight: 320,
  });
  expect(hidden.chaos.score).toBe(0);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(400);
  expect((await observe(page)).pixel.x).toBeCloseTo(hidden.pixel.x, 1);
  await page.keyboard.up('ArrowRight');
  await until(page, (s) => fridge(s).fridge?.state === 'reopening');
  expect(fridge(await observe(page)).fridge?.texture).toBe('fridge-ajar');
  expect((await observe(page)).pixel.visible).toBe(false);
  await until(page, (s) => fridge(s).fridge?.state === 'open');
  const open = await observe(page);

  expect(open.pixel.visible).toBe(true);
  expect(open.pixel.x).toBeCloseTo(hidden.pixel.x, 0);
  await until(page, (s) => s.pixel.grounded);
  expect((await observe(page)).pixel.bottom).toBeCloseTo(468, 0);
  expect(open.chaos.score).toBe(24);
  expect(fridge(open).enabled).toBe(true);
  expect(fridge(open).fridge).toMatchObject({ hidden: false, texture: 'fridge-open', events: 1 });
  expect(open.album.pending).toContain('fridge.cream');
  expect(open.pantry[0].bottom).toBeCloseTo(148, 0);
  await page.clock.runFor(2500);
  expect((await observe(page)).chaos.score).toBe(24);
  await move(page, ['r'], (s) => s.generation > open.generation);
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge).toMatchObject({
    state: 'idle',
    events: 0,
    texture: 'fridge-upright',
  });
});

test('Erster Sprung wackelt; Halten und langes Danebenstehen öffnen nicht, zweiter Sprung, Pause und Reset bleiben sicher', async ({
  page,
}) => {
  await start(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await move(page, ['Space', 'ArrowRight'], (s) => fridge(s).fridge?.bumps === 1);
  expect(fridge(await observe(page)).fridge?.state).toBe('warning');
  await page.keyboard.down('Space');
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(2200);
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  expect(fridge(await observe(page)).fridge).toMatchObject({ bumps: 1, state: 'idle', events: 0 });
  expect((await observe(page)).pixel.visible).toBe(true);
  expect((await observe(page)).chaos.score).toBe(0);
  await jumpAgainst(page, 2);
  await page.keyboard.press('Escape');
  const paused = await observe(page);

  await page.clock.runFor(2000);
  expect(fridge(await observe(page))).toEqual(fridge(paused));
  await page.locator('[data-pause-resume]').click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await observe(page);

  await page.clock.runFor(1000);
  expect(fridge(await observe(page))).toEqual(fridge(blurred));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await move(page, ['r'], (s) => s.generation > paused.generation);
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge?.bumps).toBe(0);
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Seitliches Hochgreifen bleibt ein friedlicher Rückweg und öffnet die Tür nicht', async ({
  page,
}) => {
  await start(page, 'fridge-right');
  await move(page, ['ArrowLeft', 'ArrowUp'], (s) => s.pixel.climbing);
  await move(page, ['ArrowUp'], (s) => s.pixel.bottom <= 170);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 1170);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 148) < 2);
  expect(fridge(await observe(page)).fridge?.state).toBe('idle');
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Ein tatsächlicher Fremdtreffer bringt den Innenraum einmalig durcheinander, ohne Pixel zu verstecken', async ({
  page,
}) => {
  await start(page, 'fridge-incoming');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].x > 1018);
  await until(page, (s) => fridge(s).fridge?.state === 'open');
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge?.events).toBe(1);
  await page.clock.runFor(2500);
  expect(fridge(await observe(page)).fridge?.events).toBe(1);
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

test.describe('Kühlschrank mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Bildschirmtasten starten den Besuch; reduzierte Bewegung bewahrt Innenchaos und sichtbaren Rückweg', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('pixels-world.reduced-motion', 'true'));
    await start(page);
    const touch = await TouchDriver.create(page);

    await touch.press('right');
    await until(page, (s) => s.pixel.x >= 1008);
    await touch.lift();

    for (const count of [1, 2]) {
      await touch.press('right', 1);
      await touch.press('jump', 2);
      await until(page, (s) => (fridge(s).fridge?.bumps ?? 0) >= count);
      await touch.lift(2);
      await touch.lift(1);

      if (count === 1) await until(page, (s) => s.pixel.grounded);
    }

    await until(page, (s) => fridge(s).fridge?.hidden === true);
    await page.clock.runFor(100);
    expect(fridge(await observe(page)).fridge?.angle).toBe(0);
    await until(page, (s) => fridge(s).fridge?.state === 'open');
    expect((await observe(page)).pixel.visible).toBe(true);
    expect((await observe(page)).chaos.score).toBe(24);
  });
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
    await jumpAgainst(page, 1);
    await until(page, (s) => s.pixel.grounded);
    const round = (await observe(page)).round;

    await page.clock.runFor(Math.max(0, round.returnAtMs - round.elapsedMs - remaining));
    await jumpAgainst(page, 2);
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
  await page.goto('/play.html?room=fridge-visit&camera=room');
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

test('Die rechte Seite hat keine Klinke und startet auch beim zweiten Sprung keinen Besuch', async ({
  page,
}) => {
  await start(page, 'fridge-right');
  await move(page, ['Space', 'ArrowLeft'], (s) => fridge(s).fridge?.bumps === 1);
  expect((await observe(page)).pixel.visible).toBe(true);
  expect((await observe(page)).chaos.score).toBe(0);
  await until(page, (s) => s.pixel.grounded);
  await move(page, ['Space', 'ArrowLeft'], (s) => !s.pixel.grounded);
  await until(page, (s) => s.pixel.grounded);
  expect(fridge(await observe(page)).fridge?.events).toBe(0);
  expect(fridge(await observe(page)).fridge?.bumps).toBe(1);
  expect((await observe(page)).pixel.visible).toBe(true);
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
