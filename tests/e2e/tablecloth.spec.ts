/* eslint-disable max-lines-per-function -- Reale Stoffzüge, Kontakte und Rundenabschlüsse bleiben als vollständige Bedienabläufe prüfbar. */
import { test, expect, waitForGame } from './support';
import { observe, until, move, climbToCounter, finishCharm } from './kitchen-support';
import { TouchDriver } from './touch-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

async function grab(page: Page, side: 'left' | 'right' = 'right', edge = 560) {
  if (side === 'left') {
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 305);
    await move(page, ['ArrowUp'], (s) => s.pixel.climbing);
  } else {
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= edge + 20);
    await move(page, ['Space', 'ArrowUp'], (s) => s.pixel.climbing);
  }
}

test('Zwei kurze Enden bleiben über dem Boden; Vorbeilaufen und Springen ohne ↑ ziehen keinen Stoff', async ({
  page,
}) => {
  await start(page, 'cloth-chain');
  const cloth = (await observe(page)).tablecloths[0];

  expect(cloth.climbAreas).toHaveLength(2);
  expect(cloth.art).toMatchObject({
    leftVisible: true,
    leftHeight: 60,
    tailVisible: true,
    tailHeight: 60,
  });
  expect(cloth.climbAreas.every((grip) => grip.area.y + grip.area.height <= 388)).toBe(true);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 580);
  await move(page, ['Space'], (s) => !s.pixel.grounded);
  await until(page, (s) => s.pixel.grounded);
  await page.clock.runFor(800);
  expect((await observe(page)).pixel.climbing).toBe(false);
  expect((await observe(page)).tablecloths[0].offset).toBe(0);
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Frühes Abspringen beendet die Kletterwarnung ohne Stoffbewegung oder Schaden', async ({
  page,
}) => {
  await start(page, 'cloth-chain');
  await grab(page);
  expect((await observe(page)).tablecloths[0].state).toBe('warning');
  expect((await observe(page)).tablecloths[0].art.warningVisible).toBe(true);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x < 490);
  await until(page, (s) => s.tablecloths[0].state === 'idle' && s.pixel.grounded);
  expect((await observe(page)).tablecloths[0].offset).toBe(0);
  expect((await observe(page)).chaos.score).toBe(0);
});

test(
  'Zwei Gegenstände fallen nacheinander; Teilzug, Pause, Fortsetzen und Reset bleiben kausal',
  { tag: '@smoke' },
  async ({ page }, info) => {
    await start(page, 'cloth-chain');
    const initial = await observe(page);

    await grab(page);
    await move(page, ['ArrowUp'], (s) => s.tablecloths[0].offset >= 12);
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(1000);
    expect((await observe(page)).tablecloths).toEqual(paused.tablecloths);
    expect((await observe(page)).dishes).toEqual(paused.dishes);
    await page.locator('[data-pause-resume]').click();
    await move(page, ['ArrowUp'], (s) => ['falling', 'broken'].includes(s.dishes[0].state));
    const first = await observe(page);

    expect(first.dishes[1].bottom).toBeCloseTo(328, 0);
    expect(first.dishes[1].state).not.toBe('broken');
    expect(first.dishes[1].x).toBeGreaterThan(initial.dishes[1].x);
    await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x < 490);
    await until(page, (s) => s.tablecloths[0].state === 'idle' && s.pixel.grounded);
    const partial = await observe(page);

    await page.clock.runFor(700);
    expect((await observe(page)).tablecloths[0].offset).toBe(partial.tablecloths[0].offset);
    expect((await observe(page)).dishes[1].x).toBeCloseTo(partial.dishes[1].x, 0);
    expect((await observe(page)).dishes[1].state).not.toBe('broken');
    expect((await observe(page)).album.pending).not.toContain('tablecloth.warm');
    await move(page, ['r'], (s) => s.generation > initial.generation);
    expect((await observe(page)).tablecloths[0]).toMatchObject({
      state: 'idle',
      offset: 0,
      events: 0,
    });
    expect((await observe(page)).dishes.map((item) => [item.x, item.state])).toEqual(
      initial.dishes.map((item) => [item.x, item.state]),
    );
    await until(page, (s) => s.pixel.grounded);
    await grab(page);
    await move(page, ['ArrowUp'], (s) => s.tablecloths[0].state === 'displaced');
    await move(page, ['ArrowLeft'], (s) => s.pixel.x < 490);
    await until(page, (s) => s.dishes.every((item) => item.state === 'broken'));
    const finished = await observe(page);

    expect(finished.tablecloths[0]).toMatchObject({ events: 1, offset: 240, pulledBy: 'pixel' });
    expect(finished.tablecloths[0].art).toMatchObject({
      topVisible: false,
      tailVisible: false,
      leftVisible: false,
      pileVisible: true,
    });
    expect(finished.dishes.map((item) => item.shards)).toEqual([7, 7]);
    expect(finished.chaos.score).toBe(48);
    expect(finished.album.pending).toContain('tablecloth.warm');
    await info.attach('tischdecke-abgezogen', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.clock.runFor(1500);
    expect((await observe(page)).chaos.score).toBe(48);
    await move(page, ['r'], (s) => s.generation > finished.generation);
    expect((await observe(page)).tablecloths[0].offset).toBe(0);
    expect((await observe(page)).tablecloths[0].art.pileVisible).toBe(false);
  },
);

test('Fallendes Glas zieht die Decke kurz ohne Pixelkontakt; die Kette endet begrenzt', async ({
  page,
}) => {
  await start(page, 'cloth-incoming');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) => s.tablecloths[0].offset > 0);
  expect((await observe(page)).tablecloths[0].pulledBy).toBe('source-jar');
  await until(page, (s) => s.tablecloths[0].state === 'idle');
  const stopped = await observe(page);

  expect(stopped.tablecloths[0].progress).toBeGreaterThan(0);
  expect(stopped.tablecloths[0].progress).toBeLessThan(1);
  expect(stopped.tablecloths[0].events).toBe(0);
  expect(stopped.pixel.bottom).toBeLessThan(328);
  await page.clock.runFor(1200);
  expect((await observe(page)).tablecloths[0].offset).toBe(stopped.tablecloths[0].offset);
});

test('Benachbarte Decken können einen Fremdzug übertragen, ohne sich endlos anzutreiben', async ({
  page,
}) => {
  await start(page, 'cloth-pair');
  await grab(page, 'right', 340);
  await move(page, ['ArrowUp'], (s) => s.tablecloths[1].progress > 0);
  expect((await observe(page)).tablecloths[1].pulledBy).toBe('first-cloth');
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x > 420);
  await until(page, (s) => s.tablecloths.every((cloth) => cloth.state === 'idle'));
  const stopped = await observe(page);

  await page.clock.runFor(2000);
  expect((await observe(page)).tablecloths.map((cloth) => cloth.offset)).toEqual(
    stopped.tablecloths.map((cloth) => cloth.offset),
  );
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Auflagenverlust legt den Stoff einmalig ab und lässt beide Gegenstände tatsächlich fallen', async ({
  page,
}) => {
  await start(page, 'cloth-support');

  for (
    let i = 0;
    i < 8 && (await observe(page)).shelves.find((s) => s.id === 'kitchen-table')?.enabled;
    i++
  ) {
    await move(page, ['Space'], (s) => !s.pixel.grounded);
    await until(
      page,
      (s) => s.pixel.grounded || !s.shelves.find((shelf) => shelf.id === 'kitchen-table')?.enabled,
    );
  }

  await until(
    page,
    (s) =>
      s.tablecloths[0].state === 'displaced' && s.dishes.every((item) => item.state === 'broken'),
  );
  expect((await observe(page)).tablecloths[0].events).toBe(1);
  const score = (await observe(page)).chaos.score;

  await page.clock.runFor(1000);
  expect((await observe(page)).chaos.score).toBe(score);
});

for (const outcome of ['success', 'failed'] as const)
  test(`Öffentliche Küche: abgezogene Decke nach ${outcome === 'success' ? 'erfolgreicher' : 'gescheiterter'} Versöhnung`, async ({
    page,
  }) => {
    await start(page, 'kitchen&room-seed=pantry-easy-1');
    await grab(page);
    let deepest = 0;

    await move(page, ['ArrowUp'], (s) => {
      deepest = Math.max(deepest, s.pixel.bottom);

      return s.tablecloths[0].state === 'displaced';
    });
    expect(deepest).toBeLessThanOrEqual(469);
    await until(page, (s) => !s.pixel.climbing && s.pixel.grounded);
    expect((await observe(page)).pixel.bottom).toBeCloseTo(468, 0);
    expect((await observe(page)).album.pending).toContain('tablecloth.warm');
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
    expect(finished.album.confirmed.includes('tablecloth.warm')).toBe(outcome === 'success');

    if (outcome === 'failed') await expect(page.locator('.album-banner')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
  });

test.describe('Tischdecke mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Ziehen mit Bildschirmtasten bei ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/play.html?room=cloth-chain');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await until(page, (s) => s.pixel.grounded);
      await touch.press('right');
      await until(page, (s) => s.pixel.x >= 580);
      await touch.lift();
      await touch.press('jump', 1);
      await touch.press('up', 2);
      await until(page, (s) => s.pixel.climbing);
      await touch.lift(1);
      await until(page, (s) => s.tablecloths[0].state === 'displaced');
      await touch.lift(2);
      expect((await observe(page)).tablecloths[0].events).toBe(1);
    });
});

test('Reduzierte Bewegung hält das Stoffende gerade; Fokusverlust hält Zug und Gegenstände an', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'cloth-chain');
  await grab(page);
  expect((await observe(page)).tablecloths[0].art.tailAngle).toBe(0);
  await move(page, ['ArrowUp'], (s) => s.tablecloths[0].offset > 0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(1000);
  expect((await observe(page)).tablecloths).toEqual(paused.tablecloths);
  expect((await observe(page)).dishes).toEqual(paused.dishes);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await move(page, ['ArrowUp'], (s) => s.tablecloths[0].state === 'displaced');
  expect((await observe(page)).tablecloths[0].events).toBe(1);
  expect((await observe(page)).tablecloths[0].art.tailAngle).toBe(0);
});

test(
  'Linkes Ende ist vom Hocker bekletterbar, zieht nach links und gibt Pixel beim Abreißen frei',
  { tag: '@smoke' },
  async ({ page }, info) => {
    await start(page, 'cloth-left');
    const initial = await observe(page);

    await grab(page, 'left');
    const attached = await observe(page);

    expect(attached.pixel.climbing).toBe(true);
    await move(page, ['ArrowUp'], (s) => s.tablecloths[0].offset <= -12);
    expect((await observe(page)).pixel.bottom).toBeLessThan(attached.pixel.bottom);
    expect((await observe(page)).dishes[1].x).toBeLessThan(initial.dishes[1].x);
    await info.attach('links-am-stoff', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await move(page, ['ArrowUp'], (s) => s.tablecloths[0].state === 'displaced');
    expect((await observe(page)).tablecloths[0]).toMatchObject({
      offset: -240,
      events: 1,
      pullSide: -1,
    });
    expect((await observe(page)).tablecloths[0].climbAreas).toEqual([]);
    await move(page, ['ArrowLeft'], (s) => !s.pixel.climbing && s.pixel.x < 240);
    await until(page, (s) => s.pixel.grounded);
    const finished = await observe(page);

    await move(page, ['r'], (s) => s.generation > finished.generation);
    expect((await observe(page)).tablecloths[0]).toMatchObject({ offset: 0, events: 0 });
    expect((await observe(page)).tablecloths[0].climbAreas).toHaveLength(2);
  },
);
