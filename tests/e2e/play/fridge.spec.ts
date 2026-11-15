/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect } from '../support/support';
import { observe, until, move } from './playground-object-support';
import { TouchDriver } from '../support/touch-support';
import type { Page } from '@playwright/test';
import { loadScenario, togglePause, resume, type ObjectState } from './playground-object-support';

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
  await loadScenario(page, room);
}

const fridge = (s: ObjectState) => s.shelves.find((p) => p.isFridge)!;

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
  expect(open.discoveries).toContain('fridge.cream');
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

test('Klinkengriff, Pause, Fokusverlust und Reset bleiben sicher', async ({ page }) => {
  await start(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await grabHandle(page);
  await togglePause(page);
  const paused = await observe(page);

  await page.clock.runFor(2000);
  expect(fridge(await observe(page))).toEqual(fridge(paused));
  await resume(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await observe(page);

  await page.clock.runFor(1000);
  expect(fridge(await observe(page))).toEqual(fridge(blurred));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await move(page, ['r'], (s) => s.generation > paused.generation);
  expect((await observe(page)).pixel.visible).toBe(true);
  expect(fridge(await observe(page)).fridge?.state).toBe('idle');
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

test('Ein fallendes Glas beschädigt den Inhalt bei geschlossener Tür; Pause und späterer Besuch bleiben sicher @smoke', async ({
  page,
}) => {
  await start(page, 'fridge-incoming');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].x > 1018);
  await until(page, (s) => fridge(s).fridge?.events === 1);
  const hit = await observe(page);

  expect(hit.pixel.visible).toBe(true);
  expect(fridge(hit).fridge).toMatchObject({
    state: 'idle',
    doorState: 'closed',
    texture: 'fridge-upright',
    displayWidth: 160,
    displayHeight: 320,
    hidden: false,
    captured: false,
    events: 1,
    progress: 0,
    lastDamage: { kind: 'spill', value: 24 },
  });
  expect(Math.abs(fridge(hit).fridge!.angle)).toBeLessThanOrEqual(2.5);
  await togglePause(page);
  const paused = await observe(page);

  await page.clock.runFor(2000);
  expect(fridge(await observe(page))).toEqual(fridge(paused));
  await resume(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await observe(page);

  await page.clock.runFor(1000);
  expect(fridge(await observe(page))).toEqual(fridge(blurred));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.clock.runFor(1000);
  await descendFromSourceShelf(page);
  const settled = await observe(page);

  expect(fridge(settled).fridge).toMatchObject({ state: 'idle', events: 1, angle: 0 });
  expect(settled.discoveries).toContain('fridge.cream');
  await enter(page);
  await until(page, (s) => fridge(s).fridge?.state === 'open');
  const visited = await observe(page);

  expect(visited.pixel.visible).toBe(true);
  expect(fridge(visited).fridge).toMatchObject({
    texture: 'fridge-open',
    captured: false,
    events: 1,
  });
  expect(visited.chaos.score).toBe(settled.chaos.score);
  expect(visited.discoveries).toEqual(settled.discoveries);
  await page.clock.runFor(1000);
  expect(fridge(await observe(page)).fridge?.events).toBe(1);
  await move(page, ['r'], (s) => s.generation > visited.generation);
  expect(fridge(await observe(page)).fridge).toMatchObject({
    state: 'idle',
    doorState: 'closed',
    events: 0,
    angle: 0,
  });
  expect((await observe(page)).chaos.score).toBe(0);
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

    await touch.press('right', 1);
    await touch.press('jump', 2);
    await until(page, (s) => fridge(s).fridge?.state === 'hanging');
    await touch.lift(2);
    await touch.lift(1);

    await until(page, (s) => fridge(s).fridge?.hidden === true);
    await page.clock.runFor(100);
    expect(fridge(await observe(page)).fridge?.angle).toBe(0);
    await until(page, (s) => fridge(s).fridge?.state === 'open');
    expect((await observe(page)).pixel.visible).toBe(true);
    expect((await observe(page)).chaos.score).toBe(24);
  });
});

test('Die rechte Seite hat keine Klinke und startet auch beim zweiten Sprung keinen Besuch', async ({
  page,
}) => {
  await start(page, 'fridge-right');
  await move(page, ['Space', 'ArrowLeft'], (s) => !s.pixel.grounded);
  expect((await observe(page)).pixel.visible).toBe(true);
  expect((await observe(page)).chaos.score).toBe(0);
  await until(page, (s) => s.pixel.grounded);
  await move(page, ['Space', 'ArrowLeft'], (s) => !s.pixel.grounded);
  await until(page, (s) => s.pixel.grounded);
  expect(fridge(await observe(page)).fridge?.events).toBe(0);
  expect(fridge(await observe(page)).fridge).toMatchObject({ state: 'idle', angle: 0 });
  expect((await observe(page)).pixel.visible).toBe(true);
});
