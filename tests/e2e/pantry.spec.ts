import { TouchDriver } from './touch-support';
/* eslint-disable max-lines-per-function -- Reale Kontakte, begrenzte Inhalte und Reset werden als vollständige Spielabläufe geprüft. */
import { test, expect, waitForGame } from './support';
import { observe, until, move, climbToCounter, finishCharm } from './kitchen-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

for (const room of ['pantry-jars', 'pantry-tins', 'pantry-mixed'])
  test(
    `${room}: reale Behälterkette, einmaliger Endzustand, Pause und Reset`,
    { tag: '@smoke' },
    async ({ page }, info) => {
      await start(page, room);
      const initial = await observe(page);

      await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
      expect((await observe(page)).chaos.score).toBe(0);
      await page.keyboard.press('Escape');
      const paused = await observe(page);

      await page.clock.runFor(700);
      expect((await observe(page)).pantry).toEqual(paused.pantry);
      await page.locator('[data-pause-resume]').click();
      await move(page, ['r'], (s) => s.generation > initial.generation);
      await until(page, (s) => s.pixel.grounded);
      expect(
        (await observe(page)).pantry.every((item) => item.events === 0 && item.contents === null),
      ).toBe(true);
      await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
      await until(page, (s) => s.pantry.every((item) => ['broken', 'opened'].includes(item.state)));
      await page.clock.runFor(400);
      const finished = await observe(page);

      expect(finished.pantry.every((item) => item.events === 1 && item.contents?.visible)).toBe(
        true,
      );

      for (const item of finished.pantry) {
        expect(item.state).toBe(item.appearance === 'jar' ? 'broken' : 'opened');
        expect(item.shards).toBe(item.appearance === 'jar' ? 7 : 0);
        expect(finished.album.pending).toContain(`pantry.${item.appearance}`);
        expect(item.contents!.x - item.contents!.width / 2).toBeGreaterThanOrEqual(0);
        expect(item.contents!.x + item.contents!.width / 2).toBeLessThanOrEqual(960);
      }

      if (room === 'pantry-mixed') expect(finished.plants[0].damage).toBe(0);
      expect(finished.pixel.x).toBeLessThan(190);
      await info.attach(room, { body: await page.screenshot(), contentType: 'image/png' });
      await page.clock.runFor(1000);
      expect((await observe(page)).chaos.score).toBe(finished.chaos.score);
      await move(page, ['r'], (s) => s.generation > finished.generation);
      expect(
        (await observe(page)).pantry.map((item) => [
          item.x,
          item.y,
          item.state,
          item.events,
          item.contents,
        ]),
      ).toEqual(
        initial.pantry.map((item) => [item.x, item.y, item.state, item.events, item.contents]),
      );
    },
  );

async function collapseShelf(page: Page) {
  for (
    let count = 0;
    count < 8 && (await observe(page)).shelves.find((s) => s.id === 'pantry-shelf')?.enabled;
    count++
  ) {
    await move(page, ['Space'], (s) => !s.pixel.grounded);
    await until(
      page,
      (s) => s.pixel.grounded || !s.shelves.find((shelf) => shelf.id === 'pantry-shelf')?.enabled,
    );
  }
}

for (const appearance of ['jar', 'tin'])
  test(`${appearance}: verlorene Auflage, echter Fall und einmaliger Schaden`, async ({ page }) => {
    await start(page, `pantry-${appearance}-support`);
    await collapseShelf(page);
    await until(page, (s) => s.pantry[0].events === 1);
    await page.clock.runFor(500);
    const landed = await observe(page);

    expect(landed.pantry[0].contents?.y).toBe(468);
    expect(landed.pantry[0].events).toBe(1);
    await page.clock.runFor(700);
    expect((await observe(page)).chaos.score).toBe(landed.chaos.score);
  });

test('Bereits offene Dose verliert ihre Auflage; Inhalt fällt ohne erneuten Schaden mit', async ({
  page,
}) => {
  await start(page, 'pantry-open-support');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) => s.pantry[1].state === 'opened');
  await page.clock.runFor(400);
  expect((await observe(page)).pantry[1].contents?.y).toBe(300);
  await collapseShelf(page);
  await page.clock.runFor(700);
  expect((await observe(page)).pantry[1].contents?.y).toBe(468);
  expect((await observe(page)).pantry[1].events).toBe(1);
});

for (const appearance of ['jar', 'tin'])
  test(`${appearance}: Fremdtreffer löst Endzustand ohne Pixelkontakt aus`, async ({ page }) => {
    await start(page, `pantry-${appearance}-incoming`);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 100);
    await until(page, (s) => s.pantry[0].events === 1);
    expect((await observe(page)).pixel.x).toBeLessThan(155);
    expect((await observe(page)).pantry[0].state).toBe(appearance === 'jar' ? 'broken' : 'opened');
  });

test('Bewegtes Vorratsglas kippt eine Pflanze ohne direkte Pixelberührung', async ({ page }) => {
  await start(page, 'pantry-outgoing');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) => s.plants[0].state === 'tipped');
  expect((await observe(page)).pixel.x).toBeLessThan(130);
  expect((await observe(page)).plants[0].events).toBe(1);
});

for (const [appearance, difficulty, seed] of [
  ['jar', 'normal', 'pantry-normal-15'],
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
      await climbToCounter(page);
      const target = (await observe(page)).pantry.find(
        (item) => item.id === 'kitchen-counter:counter-1',
      )!;

      expect(target.appearance).toBe(appearance);
      await move(
        page,
        ['ArrowLeft'],
        (s) => s.pantry.find((item) => item.id === target.id)?.state === 'moving',
      );
      await until(page, (s) => s.pantry.find((item) => item.id === target.id)?.events === 1);
      expect((await observe(page)).album.pending).toContain(`pantry.${appearance}`);
      await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
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

test.describe('Behälter mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Dose mit Bildschirmtasten bei ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/play.html?room=pantry-tins');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await until(page, (s) => s.pixel.grounded);
      await touch.press('right');
      await until(page, (s) => s.pantry[0].state === 'moving');
      await touch.lift();
      await until(page, (s) => s.pantry.every((item) => item.state === 'opened'));
      expect((await observe(page)).pantry.map((item) => item.events)).toEqual([1, 1]);
      expect((await observe(page)).chaos.score).toBe(32);
    });
});

test('Reduzierte Bewegung öffnet die Dose ohne Streu-Tween; Fokusverlust friert Bewegung ein', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'pantry-tins');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(700);
  expect((await observe(page)).pantry).toEqual(paused.pantry);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await until(page, (s) => s.pantry.every((item) => item.state === 'opened'));
  expect((await observe(page)).pantry.every((item) => item.contents?.width === 84)).toBe(true);
});
