import type { GameTestState } from '../../src/test-state';
/* eslint-disable max-lines-per-function -- Reale Kontakte, gerichtete Ketten und gemeinsame Runden-/Albumgrenzen werden über echte Bedienung geprüft. */
import { test, expect, waitForGame } from './support';
import type { Page } from '@playwright/test';
import { observe, until, move, climbToCounter } from './kitchen-support';
import { TouchDriver } from './touch-support';

async function start(page: Page, room = 'kitchen-preview') {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
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
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).foodBags).toEqual(paused.foodBags);
    await page.locator('[data-pause-resume]').click();
    await until(page, (s) => s.foodBags[0].state === 'spilled');
    const spilled = await observe(page);

    expect(spilled.chaos.score).toBe(18);
    expect(spilled.foodBags[0].events).toBe(1);
    expect(spilled.foodBags[0].art.spilledTexture).toBe('food-bag-spilled');
    expect(spilled.album.pending).toContain('food-bag.dry');
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
    expect((await observe(page)).album.pending).toEqual([]);
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
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).foodBags).toEqual(paused.foodBags);
    expect((await observe(page)).books).toEqual(paused.books);
    await page.locator('[data-pause-resume]').click();
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

async function pressCharmArrow(page: Page, input: GameTestState['reconciliation']) {
  if (!input.expected) throw new Error('Sichtbarer Pfeil fehlt');
  const arrow = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }[
    input.expected
  ];

  await move(
    page,
    [arrow],
    (s) => s.reconciliation.stage !== 'input' || s.reconciliation.step > input.step,
  );
}

async function finishCharm(page: Page, success: boolean) {
  while (!['complete', 'failed'].includes((await observe(page)).reconciliation.stage)) {
    const input = (await observe(page)).reconciliation;

    if (input.stage === 'reading' || input.stage === 'feedback')
      await move(page, ['Space'], (s) => s.reconciliation.stage === 'cue');
    else if (input.stage === 'cue') await until(page, (s) => s.reconciliation.stage === 'input');
    else if (input.stage === 'input') {
      if (!success) await page.clock.runFor(input.inputMs + 32);
      else {
        await pressCharmArrow(page, input);
      }
    } else await until(page, (s) => s.reconciliation.stage === 'complete');
  }
}

for (const outcome of ['success', 'failed'] as const)
  test(`Beutelschaden verhindert friedlichen Abschluss; ${outcome} bestätigt oder verwirft Napf- und Beutelfund gemeinsam`, async ({
    page,
  }) => {
    await start(page);
    await move(page, ['ArrowRight'], (s) => s.foodBags[0].state === 'spilled');
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 110);
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    const home = await observe(page);

    expect(home.homecoming.selection?.peaceful).toBe(false);
    expect(home.album.pending).toEqual(expect.arrayContaining(['food-bag.dry', 'goal.food-bowl']));
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    expect((await observe(page)).result?.peaceful).toBe(false);
    expect((await observe(page)).result?.outcome).toBe(outcome);

    if (outcome === 'success')
      expect((await observe(page)).album.confirmed).toEqual(
        expect.arrayContaining(['food-bag.dry', 'goal.food-bowl']),
      );
    else {
      expect((await observe(page)).album.confirmed).toEqual([]);
      await expect(page.locator('.album-banner')).toBeHidden();
    }

    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
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
      await page.goto('/play.html?room=kitchen-preview');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await touch.press('right');
      await until(page, (s) => s.foodBags[0].state === 'falling');
      await touch.lift();
      await until(page, (s) => s.foodBags[0].state === 'spilled');
      expect((await observe(page)).chaos.score).toBe(18);
    });
});
