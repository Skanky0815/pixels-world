/* eslint-disable max-lines-per-function -- Reale Kontakte und Rundenabschlüsse prüfen den gemeinsamen Kipp-, Album- und Speichervertrag. */
import { test, expect, waitForGame } from '../support/support';
import { observe, until, move, climbToCounter, finishCharm } from './kitchen-support';
import { TouchDriver } from '../support/touch-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

test(
  'Mülleimerkette: zwei Eimer und Bücher, einmaliger Schaden, Pause und Reset',
  { tag: '@smoke' },
  async ({ page }, info) => {
    await start(page, 'bin-chain');
    const initial = await observe(page);

    await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
    expect((await observe(page)).chaos.score).toBe(0);
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).trashBins).toEqual(paused.trashBins);
    await page.locator('[data-pause-resume]').click();
    await move(page, ['r'], (s) => s.generation > initial.generation);
    expect(
      (await observe(page)).trashBins.every((bin) => bin.state === 'upright' && bin.events === 0),
    ).toBe(true);
    await until(page, (s) => s.pixel.grounded);
    await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
    await until(
      page,
      (s) => s.trashBins.every((bin) => bin.state === 'spilled') && s.books[0].state === 'fallen',
    );
    const spilled = await observe(page);

    expect(spilled.trashBins.map((bin) => bin.events)).toEqual([1, 1]);
    expect(spilled.trashBins[1].toppledBy).toBe('first-bin');
    expect(spilled.books[0].toppledBy).toBe('second-bin');
    expect(spilled.pixel.x).toBeLessThan(430);
    expect(spilled.chaos.score).toBe(56);
    expect(spilled.album.pending).toContain('trash-bin.cream');
    expect(spilled.trashBins[0].art).toMatchObject({
      intactVisible: false,
      spilledVisible: true,
      spilledTexture: 'trash-bin-spilled',
    });
    await info.attach('muelleimer-geleert', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.clock.runFor(1500);
    expect((await observe(page)).chaos.score).toBe(56);
    await move(page, ['r'], (s) => s.generation > spilled.generation);
    expect(
      (await observe(page)).trashBins.map((bin) => [bin.x, bin.y, bin.state, bin.events]),
    ).toEqual(initial.trashBins.map((bin) => [bin.x, bin.y, bin.state, bin.events]));
  },
);

test('Kurzes Anstupsen warnt, Weggehen bricht ab; Fokusverlust friert aktive Zeit ein', async ({
  page,
}) => {
  await start(page, 'bin-warning');
  await until(page, (s) => s.trashBins[0].state === 'wobbling');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(1500);
  expect((await observe(page)).trashBins).toEqual(paused.trashBins);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await move(page, ['ArrowLeft'], (s) => s.pixel.x < 135);
  await until(page, (s) => s.trashBins[0].state === 'upright');
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Fallendes Vorratsglas kippt den Mülleimer ohne Pixelkontakt', async ({ page }) => {
  await start(page, 'bin-incoming');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) => s.trashBins[0].state === 'spilled');
  expect((await observe(page)).trashBins[0].toppledBy).toBe('source-jar');
  expect((await observe(page)).trashBins[0].events).toBe(1);
});

test('Kippender Eimer stößt Kräuter um; Inhalt erzeugt keine weiteren Schäden', async ({
  page,
}) => {
  await start(page, 'bin-outgoing');
  await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
  await until(page, (s) => s.trashBins[0].state === 'spilled' && s.plants[0].state === 'tipped');
  const finished = await observe(page);

  expect(finished.pixel.x).toBeLessThan(430);
  await page.clock.runFor(1800);
  expect((await observe(page)).chaos.score).toBe(finished.chaos.score);
});

for (const outcome of ['success', 'failed'] as const)
  test(`Öffentliche Küche: Mülleimerfund nach ${outcome === 'success' ? 'erfolgreicher' : 'gescheiterter'} Versöhnung`, async ({
    page,
  }) => {
    await start(page, 'kitchen&room-seed=pantry-easy-12');
    await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
    await until(page, (s) => s.trashBins[0].state === 'spilled');
    expect((await observe(page)).album.pending).toContain('trash-bin.cream');
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 175);
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    const finished = await observe(page);

    expect(finished.result?.outcome).toBe(outcome);
    expect(finished.album.confirmed.includes('trash-bin.cream')).toBe(outcome === 'success');

    if (outcome === 'failed') await expect(page.locator('.album-banner')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
  });

test.describe('Mülleimer mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Kippen mit Bildschirmtasten bei ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/play.html?room=bin-chain');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await until(page, (s) => s.pixel.grounded);
      await touch.press('right');
      await until(page, (s) => s.trashBins[0].state === 'falling');
      await touch.lift();
      await until(page, (s) => s.trashBins.every((bin) => bin.state === 'spilled'));
      expect((await observe(page)).trashBins.map((bin) => bin.events)).toEqual([1, 1]);
    });
});

test('Reduzierte Bewegung blendet zwischen echten Zustandsbildern ohne Drehung um', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'bin-chain');
  await move(page, ['ArrowRight'], (s) => s.trashBins[0].state === 'falling');
  await until(page, (s) => s.trashBins.every((bin) => bin.state === 'spilled'));
  expect(
    (await observe(page)).trashBins.every(
      (bin) => bin.art.spilledVisible && !bin.art.intactVisible,
    ),
  ).toBe(true);
  expect((await observe(page)).trashBins.map((bin) => bin.events)).toEqual([1, 1]);
});

test('Anlauf von rechts kippt nach links; Reset stellt denselben Bodenanker her', async ({
  page,
}) => {
  await start(page, 'bin-warning');
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 260);
  await until(page, (s) => s.trashBins[0].state === 'upright');
  expect((await observe(page)).chaos.score).toBe(0);
  await move(page, ['ArrowLeft'], (s) => s.trashBins[0].state === 'falling');
  await until(page, (s) => s.trashBins[0].state === 'spilled');
  const finished = await observe(page);

  expect(finished.trashBins[0].direction).toBe(-1);
  expect(finished.trashBins[0].x).toBe(168);
  expect(finished.trashBins[0].events).toBe(1);
  await move(page, ['r'], (s) => s.generation > finished.generation);
  expect((await observe(page)).trashBins[0]).toMatchObject({
    x: 180,
    y: 468,
    state: 'upright',
    events: 0,
  });
});
