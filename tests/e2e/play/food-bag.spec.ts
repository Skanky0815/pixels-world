/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect } from '../support/support';
import type { Page } from '@playwright/test';
import { observe, until, move } from './playground-object-support';
import { TouchDriver } from '../support/touch-support';
import { loadScenario, togglePause, resume } from './playground-object-support';

async function start(page: Page, room = 'kitchen-preview') {
  await loadScenario(page, room);
}

test(
  'Futterbeutel läuft einmal aus; Pause friert Kippen und Streufläche ein, Reset stellt beides her',
  { tag: '@smoke' },
  async ({ page }, info) => {
    await start(page);
    await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'falling');
    const initial = await observe(page);

    expect(initial.chaos.score).toBe(0);
    expect(initial.foodBags[0].toppledBy).toBe('pixel');
    await togglePause(page);
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).foodBags).toEqual(paused.foodBags);
    await resume(page);
    await until(page, (s) => s.foodBags[0].state === 'spilled');
    const spilled = await observe(page);

    expect(spilled.chaos.score).toBe(18);
    expect(spilled.foodBags[0].events).toBe(1);
    expect(spilled.foodBags[0].art.spilledTexture).toBe('food-bag-spilled');
    expect(spilled.discoveries).toContain('food-bag.dry');
    await info.attach('futterbeutel-ausgelaufen', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.clock.runFor(1000);
    expect((await observe(page)).chaos.score).toBe(18);
    await move(page, ['r'], (s) => s.generation > initial.generation);
    expect((await observe(page)).foodBags[0].state).toBe('upright');
    expect((await observe(page)).foodBags[0].events).toBe(0);
    expect((await observe(page)).foodBags[0].x).toBe(430);
    expect((await observe(page)).discoveries).toEqual([]);
  },
);

test('Kurze Warnung lässt sich durch Wegspringen abbrechen; Fokusverlust hält sie an', async ({
  page,
}) => {
  await start(page, 'food-bag-warning');
  await until(page, (s) => s.foodBags[0].state === 'wobbling');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(1000);
  expect((await observe(page)).foodBags).toEqual(paused.foodBags);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await move(page, ['Space'], (s) => s.pixel.bottom < 420);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x < 90);
  await until(page, (s) => s.pixel.grounded);
  expect((await observe(page)).foodBags[0].state).toBe('upright');
  expect((await observe(page)).chaos.score).toBe(0);
});

test(
  'Beutel trifft zweiten Beutel und Bücher; begrenzte Kette zählt jeden Schaden einmal',
  { tag: '@smoke' },
  async ({ page }) => {
    await start(page, 'food-bag-chain');
    await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'falling');
    await until(page, (s) => s.foodBags[1].state === 'falling');
    await togglePause(page);
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).foodBags).toEqual(paused.foodBags);
    expect((await observe(page)).books).toEqual(paused.books);
    await resume(page);
    await move(page, ['r'], (s) => s.generation > paused.generation);
    await until(page, (s) => s.pixel.grounded);
    expect(
      (await observe(page)).foodBags.every((bag) => bag.state === 'upright' && bag.events === 0),
    ).toBe(true);
    expect((await observe(page)).books[0].state).toBe('stacked');
    await page.clock.runFor(1000);
    expect((await observe(page)).chaos.score).toBe(0);
    await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'falling');
    await until(
      page,
      (s) => s.foodBags.every((bag) => bag.state === 'spilled') && s.books[0].state === 'fallen',
    );
    const chain = await observe(page);

    expect(chain.foodBags[1].toppledBy).toBe('first-bag');
    expect(chain.books[0].toppledBy).toBe('second-bag');
    expect(chain.pixel.x).toBeLessThan(430);
    expect(chain.foodBags.map((bag) => bag.events)).toEqual([1, 1]);
    expect(chain.chaos.score).toBe(48);
    await page.clock.runFor(1500);
    expect((await observe(page)).chaos.score).toBe(48);
  },
);

test('Umfallende Bücher kippen den Beutel ohne direkte Pixelberührung', async ({ page }) => {
  await start(page, 'food-bag-impact');
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 405);
  await until(page, (s) => s.foodBags[0].state === 'spilled');
  const hit = await observe(page);

  expect(hit.foodBags[0].toppledBy).toBe('source-books');
  expect(hit.pixel.x + 26).toBeLessThan(hit.foodBags[0].x - 16);
  expect(hit.chaos.score).toBe(30);
});

test('Verlorene Auflage lässt den Beutel tatsächlich zum Boden fallen und Reset repariert die Szene', async ({
  page,
}) => {
  await start(page, 'food-bag-support');
  const initial = await observe(page);

  for (
    let count = 0;
    count < 8 && (await observe(page)).shelves.find((s) => s.id === 'bag-shelf')?.enabled;
    count++
  ) {
    await move(page, ['Space'], (s) => !s.pixel.grounded);
    await until(page, (s) => s.pixel.grounded);
  }

  await until(page, (s) => s.foodBags[0].state === 'spilled' && s.foodBags[0].y === 468);
  expect((await observe(page)).foodBags[0].events).toBe(1);
  await move(page, ['r'], (s) => s.generation > initial.generation);
  expect((await observe(page)).foodBags[0].y).toBe(340);
  expect((await observe(page)).foodBags[0].state).toBe('upright');
});

test.describe('Beutel mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Echte Bildschirmtasten kippen den Beutel bei ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await loadScenario(page, 'kitchen-preview');
      const touch = await TouchDriver.create(page);

      await touch.press('right');
      await until(page, (s) => s.foodBags[0].state === 'falling');
      await touch.lift();
      await until(page, (s) => s.foodBags[0].state === 'spilled');
      expect((await observe(page)).chaos.score).toBe(18);
    });
});
