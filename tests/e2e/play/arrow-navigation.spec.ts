/* eslint-disable max-lines-per-function -- Reale Tastaturabläufe verbinden Fokus, native Felder und frische Spieleingaben ohne Zustandssetter. */
import { test, expect, start, state, until, waitForGame } from '../support/support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from '../support/round-clock';
import type { Locator, Page } from '@playwright/test';

test('Pfeile bedienen Menü, Unteransichten und Raumraster; native Felder und Fokus bleiben erhalten @smoke', async ({
  page,
}) => {
  await page.goto('/play.html');
  await waitForGame(page, false);
  const play = page.locator('[data-menu-play]');

  await expect(play).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(play).toBeFocused();
  await arrowTo(page, page.locator('[data-menu-settings]'), 'ArrowDown');
  await page.keyboard.press('Enter');
  const back = page.locator('[data-menu-back]');

  await expect(back).toBeFocused();
  const difficulty = page.locator('[data-difficulty]');

  await tabTo(page, difficulty);
  await page.keyboard.press('ArrowDown');
  await expect(difficulty).toBeFocused();
  await page.keyboard.press('Enter');
  // Headless macOS does not commit popup arrows; native type-ahead remains a real keyboard input.
  await page.keyboard.press('s');
  await expect(difficulty).toHaveValue('hard');
  const master = page.locator('[data-audio="master"]');

  await tabTo(page, master);
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect(master).toBeFocused();
  await expect(master).toHaveValue('1');
  const english = page.locator('[data-language="en"]');

  await tabTo(page, english);
  await page.keyboard.press('Space');
  await expect(english).toBeFocused();
  await expect(english).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, back);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-menu-settings]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-menu-text="menuHelp"]')).toBeFocused();
  const popup = page.waitForEvent('popup');

  await page.keyboard.press('Space');
  const help = await popup;

  await expect(help).toHaveURL(/help\.html$/);
  await help.close();
  await page.bringToFront();
  await arrowTo(page, page.locator('[data-menu-information]'), 'ArrowDown');
  await page.keyboard.press('Space');
  await expect(back).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-game-information] a').first()).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-menu-information]')).toBeFocused();
  await arrowTo(page, play, 'ArrowUp');
  await page.keyboard.press('Space');
  const enter = page.locator('[data-room-start]');
  const kitchen = page.locator('[data-room-choice="kitchen"]');
  const living = page.locator('[data-room-choice="living-room"]');
  const bedroom = page.locator('[data-room-choice="bedroom"]');

  await expect(enter).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(living).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(kitchen).toBeFocused();
  await expect(living).toHaveAttribute('aria-pressed', 'true');
  await expect(kitchen).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(kitchen).toHaveAttribute('aria-pressed', 'true');
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('Escape');
  await arrowTo(page, page.locator('[data-menu-settings]'), 'ArrowDown');
  await page.keyboard.press('Enter');
  await tabTo(page, page.locator('[data-language="de"]'));
  await page.keyboard.press('Space');
  await page.keyboard.press('Escape');
  await expect(kitchen).toBeFocused();
  await expect(kitchen).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 568, height: 320 });
  await expect(kitchen).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(enter).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(enter).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(bedroom).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(bedroom).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(enter).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => {
      await page.clock.runFor(32);

      return page.evaluate(() => window.__pixelTest?.room.id);
    })
    .toBe('kitchen');
  await expect(page.locator('.start-screen')).toBeVisible();
  await expect(page.locator('#game')).toBeFocused();
  expect(await page.evaluate(() => window.__pixelTest?.started)).toBe(false);
});

test('Gehaltene Tasten, Bestätigungen, Blur und Szenenwechsel benötigen frische Spieleingaben @smoke', async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down('ArrowRight');
  await until(page, (snapshot) => snapshot.pixel.x > 145);
  await page.keyboard.press('Escape');
  const paused = await state(page);

  await page.keyboard.press('Space');
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(300);
  const stopped = (await state(page)).pixel;

  // The existing physics step runs before movement sampling and can finish one old step.
  expect(stopped.velocityX).toBe(0);
  await page.clock.runFor(300);
  expect((await state(page)).pixel.x).toBeCloseTo(stopped.x, 1);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowRight');
  await until(page, (snapshot) => snapshot.pixel.x > paused.pixel.x + 20);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Escape');
  const rooms = page.locator('[data-pause-rooms]');

  await arrowTo(page, rooms, 'ArrowDown');
  await page.keyboard.down('Enter');
  await expect(page.locator('[data-menu-cancel]')).toBeFocused();
  await page.keyboard.down('Enter');
  await page.clock.runFor(200);
  await expect(page.locator('[data-menu-view="confirm"]')).toBeVisible();
  await page.keyboard.up('Enter');
  await page.keyboard.press('Space');
  await expect(rooms).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-menu-confirm]')).toBeFocused();
  await page.keyboard.down('Space');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.keyboard.up('Space');
  await expect(page.locator('[data-menu-view="confirm"]')).toBeVisible();
  const generation = (await state(page)).generation;

  await page.keyboard.down('Enter');
  await until(page, (snapshot) => snapshot.generation > generation);
  await page.keyboard.down('Enter');
  await page.clock.runFor(300);
  await expect(page.locator('.room-selection')).toBeVisible();
  expect((await state(page)).started).toBe(false);
  await page.keyboard.up('Enter');
  await page.keyboard.press('Enter');
  await until(page, (snapshot) => snapshot.intro.visible);
  await page.keyboard.down('Space');
  await until(page, (snapshot) => snapshot.started);
  await page.keyboard.down('Space');
  await page.clock.runFor(300);
  expect((await state(page)).pixel.grounded).toBe(true);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (snapshot) => !snapshot.pixel.grounded);
  await page.keyboard.up('Space');
});

test('Pausierte Versöhnung übernimmt keine gehaltene Menürichtung nach Resume', async ({
  page,
}) => {
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (snapshot) =>
      snapshot.pixelReturn.stage === 'seated' && snapshot.homecoming.stage === 'dialogue',
    100,
  );
  await page.keyboard.down('Space');
  await until(page, (snapshot) => snapshot.reconciliation.stage === 'reading', 100);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (snapshot) => snapshot.reconciliation.stage === 'input', 100);
  await page.keyboard.up('Space');
  const before = (await state(page)).reconciliation;
  const keys = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  const key = keys[before.expected!];

  await page.keyboard.press('Escape');
  await page.keyboard.down(key);
  await page.keyboard.press('Escape');
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.step).toBe(before.step);
  expect((await state(page)).reconciliation.failures).toBe(0);
  await page.keyboard.up(key);
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.step).toBe(before.step + 1);
  await page.keyboard.up(key);
});

async function arrowTo(page: Page, target: Locator, key: string) {
  for (let index = 0; index < 16; index++) {
    if (await target.evaluate((node) => node === document.activeElement)) return;
    await page.keyboard.press(key);
  }

  await expect(target).toBeFocused();
}

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 60; index++) {
    await page.keyboard.press('Tab');

    if (await target.evaluate((node) => node === document.activeElement)) return;
  }

  await expect(target).toBeFocused();
}
