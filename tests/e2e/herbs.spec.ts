/* eslint-disable max-lines-per-function -- Echte Eingaben prüfen erhöhte Auflagen, Pause, Reset und begrenzte Fremdkontakte als zusammenhängende Abläufe. */
import { test, expect, waitForGame } from './support';
import { observe, until, move, climbToCounterLanding, finishCharm } from './kitchen-support';
import { TouchDriver } from './touch-support';
import type { Page } from '@playwright/test';

async function start(page: Page, room: string) {
  await page.goto(`/play.html?room=${room}&camera=room`);
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
}

for (const herb of ['basil', 'parsley', 'mint'])
  test(
    `${herb}: auf erhöhter Auflage knabbern, wackeln, kippen, Pause und Reset`,
    { tag: '@smoke' },
    async ({ page }, info) => {
      await start(page, `herb-${herb}`);
      await until(page, (s) => s.plants[0].state === 'nibbling');
      const initial = await observe(page);

      expect(initial.plants[0].texture).toBe(`herb-${herb}-bitten`);
      expect(initial.plants[0].supportY).toBe(300);
      expect(initial.chaos.score).toBe(2);
      expect(initial.album.pending).toContain(`plant.${herb}`);
      await page.keyboard.press('Escape');
      const paused = await observe(page);

      await page.clock.runFor(1000);
      expect((await observe(page)).plants).toEqual(paused.plants);
      await page.locator('[data-pause-resume]').click();
      await until(page, (s) => s.plants[0].state === 'tipped');
      const tipped = await observe(page);

      expect(tipped.plants[0]).toMatchObject({
        damage: 2,
        events: 2,
        soilVisible: true,
        soilY: 301,
        supportY: 300,
        floorY: 468,
      });
      expect(tipped.chaos.score).toBe(12);
      await page.clock.runFor(1000);
      expect((await observe(page)).chaos.score).toBe(12);
      await info.attach(`kraut-${herb}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      await move(page, ['r'], (s) => s.generation > initial.generation);
      expect((await observe(page)).plants[0]).toMatchObject({
        texture: `herb-${herb}-intact`,
        damage: 0,
        soilVisible: false,
        supportY: 300,
      });
    },
  );

test(
  'Auflagenverlust lässt Topf und Erde fallen; gleicher Pflanzentyp reagiert ohne Pixelkontakt',
  { tag: '@smoke' },
  async ({ page }) => {
    await start(page, 'herb-support');
    const initial = await observe(page);

    await collapseShelf(page);
    await until(page, (s) => s.plants[0].dropping);
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(900);
    expect((await observe(page)).plants).toEqual(paused.plants);
    await page.locator('[data-pause-resume]').click();
    await move(page, ['r'], (s) => s.generation > initial.generation);
    expect((await observe(page)).plants.every((p) => p.damage === 0 && !p.dropping)).toBe(true);
    await until(page, (s) => s.pixel.grounded);

    await collapseShelf(page);
    await until(page, (s) => !s.plants[0].dropping && s.plants[0].supportY === 468);
    expect((await observe(page)).plants[0]).toMatchObject({ damage: 2, events: 1, soilY: 469 });
    expect((await observe(page)).plants[1].damage).toBe(2);
    const score = (await observe(page)).chaos.score;

    await page.clock.runFor(1000);
    expect((await observe(page)).chaos.score).toBe(score);
  },
);

test('Fallende Vase kippt Kräutertopf; erster Kippkontakt findet die Variante ohne vorheriges Knabbern', async ({
  page,
}) => {
  await start(page, 'herb-incoming');
  await move(page, ['ArrowRight'], (s) => s.vases[0].state === 'moving');
  await until(page, (s) => s.plants[0].state === 'tipped');
  expect((await observe(page)).album.pending).toContain('plant.parsley');
  expect((await observe(page)).plants[0].events).toBe(1);
  expect((await observe(page)).pixel.x).toBeLessThan(180);
});

test('Kippender Kräutertopf stößt Geschirr ohne Pixelkontakt an', async ({ page }) => {
  await start(page, 'herb-outgoing');
  await until(page, (s) => s.plants[0].state === 'tipped');
  await until(page, (s) => s.dishes[0].state === 'broken' || s.dishes[0].x < 79);
  expect((await observe(page)).pixel.x).toBe(150);
  const struck = await observe(page);

  expect(struck.dishes[0].state === 'broken' || struck.dishes[0].x < 80).toBe(true);
  await page.clock.runFor(1000);
  expect((await observe(page)).chaos.score).toBe(struck.chaos.score);
});

test('Reduzierte Bewegung hält Kräuter beim Knabbern ruhig; Fokusverlust stoppt aktive Zeit', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'herb-mint');
  await until(page, (s) => s.plants[0].state === 'wobbling');
  expect((await observe(page)).plants[0].angle).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(700);
  expect((await observe(page)).plants).toEqual(paused.plants);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await until(page, (s) => s.plants[0].state === 'tipped');
});

test.describe('Kräuter mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Erhöhtes Kraut mit Bildschirmtasten bei ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/play.html?room=herb-basil');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await until(page, (s) => s.plants[0].state === 'tipped');
      expect((await observe(page)).chaos.score).toBe(12);
      expect((await observe(page)).plants[0].soilY).toBe(301);
    });
});

async function collapseShelf(page: Page) {
  for (
    let count = 0;
    count < 8 && (await observe(page)).shelves.find((s) => s.id === 'herb-shelf')?.enabled;
    count++
  ) {
    await move(page, ['Space'], (s) => !s.pixel.grounded);
    await until(page, (s) => s.pixel.grounded || s.plants[0].dropping);

    if ((await observe(page)).plants[0].dropping) break;
  }
}

for (const outcome of ['success', 'failed'] as const)
  test(`Küchenkräuter: ${outcome} bestätigt oder verwirft den Fund nach wirklicher Versöhnung`, async ({
    page,
  }) => {
    await start(page, 'kitchen');
    await climbToCounterLanding(page);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 660);
    await until(
      page,
      (s) => s.plants.find((plant) => plant.id.includes('counter-herb'))?.state === 'tipped',
    );
    const herb = (await observe(page)).plants.find((plant) => plant.id.includes('counter-herb'))!;
    const entry = `plant.${herb.appearance}`;

    expect((await observe(page)).album.pending).toContain(entry);
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 800);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 860);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
    await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
    await finishCharm(page, outcome === 'success');
    await until(page, (s) => s.result !== null);
    const result = await observe(page);

    expect(result.result?.outcome).toBe(outcome);
    expect(result.album.confirmed.includes(entry)).toBe(outcome === 'success');

    if (outcome === 'failed') {
      expect(result.album.confirmed).toEqual([]);
      await expect(page.locator('.album-banner')).toBeHidden();
    }

    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
  });

test('Gekippte Pflanze gibt den überlappenden Knabberbereich für ihren Nachbarn frei', async ({
  page,
}) => {
  await start(page, 'herb-neighbors');
  await until(page, (s) => s.plants[0].state === 'tipped');
  await until(page, (s) => s.plants[1].state === 'nibbling');
  expect((await observe(page)).plants[1].damage).toBe(1);
  expect((await observe(page)).pixel.x).toBe(150);
  await until(page, (s) => s.plants[1].state === 'tipped');
  expect((await observe(page)).plants.map((plant) => plant.events)).toEqual([2, 2]);
  expect((await observe(page)).chaos.score).toBe(24);
});
