/* eslint-disable max-lines-per-function -- Reale Eingabefolgen prüfen Quellenzusammenführung, Optionen und Szenenwechsel ohne Engine-Setter. */
import { test, expect, start, state, until, waitForGame } from '../support/support';
import { loadScenario, move, observe, until as untilObject } from './playground-object-support';
import { TouchDriver } from '../support/touch-support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from '../support/round-clock';
import type { Page } from '@playwright/test';

test.use({ hasTouch: true });

async function restoredWasd(page: Page) {
  await page.addInitScript(() => localStorage.setItem('pixels-world.wasd', 'true'));
}

async function options(page: Page) {
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-settings]').click();
}

test('WASD ist wählbar, lokalisiert und gespeichert; Menü, Raumraster und native Felder bleiben bedienbar @smoke', async ({
  page,
}) => {
  await page.goto('/play.html');
  await waitForGame(page, false);
  const play = page.locator('[data-menu-play]');

  await page.keyboard.press('s');
  await expect(play).toBeFocused();
  await page.locator('[data-menu-settings]').click();
  const wasd = page.locator('[data-wasd]');

  await expect(wasd).not.toBeChecked();
  await expect(wasd).toHaveAccessibleName('WASD zusätzlich verwenden');
  await wasd.check();
  const difficulty = page.locator('[data-difficulty]');

  await difficulty.focus();
  await page.keyboard.press('s');
  await expect(difficulty).toHaveValue('hard');
  await expect(difficulty).toBeFocused();
  const volume = page.locator('[data-audio="master"]');

  await volume.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('d');
  await expect(volume).toHaveValue('0');
  await page.keyboard.press('ArrowRight');
  await expect(volume).toHaveValue('1');
  await page.locator('[data-language="en"]').click();
  await expect(wasd).toHaveAccessibleName('Also use WASD');
  await expect(wasd).toBeChecked();
  await page.reload();
  await waitForGame(page, false);
  await page.locator('[data-menu-settings]').click();
  await expect(wasd).toBeChecked();
  await page.locator('main > header .pause-toggle').click();
  await play.focus();
  await page.keyboard.down('s');
  await expect(page.locator('[data-pause-album]')).toBeFocused();
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('[data-pause-album]')).toBeFocused();
  await page.keyboard.up('s');
  await page.keyboard.up('ArrowDown');
  await page.keyboard.press('s');
  await expect(page.locator('[data-menu-settings]')).toBeFocused();
  await play.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('w');
  const kitchen = page.locator('[data-room-choice="kitchen"]');

  await expect(page.locator('[data-room-choice="study"]')).toBeFocused();
  await page.keyboard.press('w');
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('a');
  await expect(page.locator('[data-room-choice="living-room"]')).toBeFocused();
  await page.keyboard.press('d');
  await expect(kitchen).toBeFocused();
  await page.keyboard.press('Space');
  await expect(kitchen).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-room-choice="bedroom"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-room-choice="study"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-room-start]')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.clock.runFor(100);
  await expect(page.locator('.start-controls')).toContainText('A D');
});

test('WASD, Pfeile und Touch mischen Bewegung ohne Verdopplung; Leertaste springt @smoke', async ({
  page,
}) => {
  await restoredWasd(page);
  await loadScenario(page, 'empty');
  await page.keyboard.down('d');
  await untilObject(page, (s) => s.pixel.velocityX > 100);
  const speed = (await observe(page)).pixel.velocityX;

  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(64);
  expect((await observe(page)).pixel.velocityX).toBe(speed);
  await page.keyboard.up('d');
  await page.clock.runFor(64);
  expect((await observe(page)).pixel.velocityX).toBe(speed);
  await page.keyboard.down('a');
  await page.clock.runFor(64);
  expect((await observe(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('a');
  const touch = await TouchDriver.create(page);

  await touch.press('right');
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(64);
  expect((await observe(page)).pixel.velocityX).toBe(speed);
  await page.keyboard.down('Space');
  await untilObject(page, (s) => s.pixel.velocityY < 0);
  await page.keyboard.up('Space');
  await touch.lift();
  // Ohne Richtungsdruck bleibt der vorhandene Luftschwung bis zur Landung erhalten.
  await untilObject(page, (s) => s.pixel.grounded && s.pixel.velocityX === 0);
  const stopped = (await observe(page)).pixel.x;

  await page.clock.runFor(100);
  expect((await observe(page)).pixel.x).toBeCloseTo(stopped, 1);
  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  await page.getByText('Aufbau laden / kopieren', { exact: true }).click();
  const field = page.getByLabel('Aufbaudaten');

  await field.fill('');
  await page.keyboard.type('wasd WASD');
  await page.keyboard.press('ArrowLeft');
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('wasd WASD');
  await page.clock.runFor(100);
  expect((await observe(page)).pixel.x).toBeCloseTo(stopped, 1);
});

for (const [kind, recipe, approach, target] of [
  ['Vorhang', 'living-room', 'd', 790],
  ['Tischdecke', 'cloth-chain', 'd', 580],
  ['Kühlschrank', 'fridge-right', 'a', 1201],
] as const) {
  test(`WASD klettert an ${kind}, rutscht ab und springt ab @smoke`, async ({ page }) => {
    await restoredWasd(page);
    await loadScenario(page, recipe);
    await move(page, [approach], (s) =>
      approach === 'd' ? s.pixel.x >= target : s.pixel.left <= target,
    );
    await untilObject(page, (s) => s.pixel.grounded);
    await move(page, ['Space'], (s) => s.pixel.top < 360);
    await move(page, ['w'], (s) => s.pixel.climbing && s.pixel.velocityY < 0);
    await move(page, ['s'], (s) => s.pixel.climbing && s.pixel.velocityY > 35);
    await move(page, ['Space', kind === 'Vorhang' ? 'a' : 'd'], (s) => !s.pixel.climbing);
    expect((await observe(page)).pixel.gravity).toBe(true);
  });
}

test('Optionswechsel, Pause, Außenfokus, Blur und Reset übernehmen keine gehaltenen WASD-Tasten @smoke', async ({
  page,
}) => {
  await restoredWasd(page);
  await start(page);
  await page.keyboard.down('a');
  await until(page, (s) => s.pixel.velocityX < 0);
  await options(page);
  await page.locator('[data-wasd]').uncheck();
  await page.locator('[data-wasd]').check();
  await page.keyboard.press('Escape');
  await page.keyboard.down('a');
  await page.clock.runFor(100);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('a');
  await page.keyboard.down('a');
  await until(page, (s) => s.pixel.velocityX < 0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.keyboard.down('a');
  await page.clock.runFor(100);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('a');
  await page.locator('main > header .pause-toggle').focus();
  await page.keyboard.down('d');
  await page.clock.runFor(100);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.locator('#game').focus();
  await page.keyboard.down('d');
  await page.clock.runFor(100);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('d');
  await page.keyboard.down('d');
  await until(page, (s) => s.pixel.velocityX > 0);
  const generation = (await state(page)).generation;

  await page.keyboard.down('r');
  await until(page, (s) => s.generation > generation);
  await page.keyboard.up('r');
  await page.keyboard.down('d');
  await page.clock.runFor(100);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('d');
});

test('WASD-Versöhnung dedupliziert gleiche Richtungen und hält verschiedene Richtungen mehrdeutig @smoke', async ({
  page,
}) => {
  await restoredWasd(page);
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    100,
  );
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'reading', 100);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  await page.keyboard.up('Space');
  const wasd = { left: 'a', right: 'd', up: 'w', down: 's' };
  const arrows = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  const before = (await state(page)).reconciliation;
  const direction = before.expected!;

  await page.keyboard.down(wasd[direction]);
  await page.keyboard.down(arrows[direction]);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.step).toBe(before.step + 1);
  await page.keyboard.up(wasd[direction]);
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  const next = (await state(page)).reconciliation;

  // Quellenwechsel vollständig zwischen zwei Frames: Die Richtung bleibt durchgehend gehalten.
  await page.keyboard.down(wasd[direction]);
  await page.keyboard.up(arrows[direction]);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.step).toBe(next.step);
  expect((await state(page)).reconciliation.failures).toBe(next.failures);
  const touch = await TouchDriver.create(page);

  await touch.press(direction);
  await page.keyboard.up(wasd[direction]);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.step).toBe(next.step);
  expect((await state(page)).reconciliation.failures).toBe(next.failures);
  await touch.lift();
  const other = next.expected === 'left' ? 'right' : 'left';

  await page.keyboard.down(wasd[next.expected!]);
  await page.keyboard.down(arrows[other]);
  await page.clock.runFor(100);
  expect((await state(page)).reconciliation.feedback).toBe('wrong');
  await page.keyboard.up(wasd[next.expected!]);
  await page.keyboard.up(arrows[other]);
});
