/* eslint-disable max-lines-per-function -- Reale Auswahl, Sprünge, Pause und Abschluss bilden den prüfbaren Schlafzimmerpfad. */
import { test, expect, waitForGame } from '../support/support';
import { observe, until, move, finishCharm } from './kitchen-support';
import type { Page } from '@playwright/test';
import { loadScenario } from './playground-object-support';
import { snapshot, untilPlayground, movePlayground } from './playground-support';
import { TouchDriver } from '../support/touch-support';

async function bedroom(page: Page, roomCamera = false) {
  await page.goto(roomCamera ? '/play.html?camera=room' : '/play.html');
  await waitForGame(page, false);
  await page.locator('[data-menu-play]').click();
  await page.locator('[data-room-choice="bedroom"]').click();
  await page.locator('[data-room-start]').click();
  await until(page, (s) => s.room.id === 'bedroom' && s.intro.visible);
  await page.locator('#game').focus();
  await move(page, ['Space'], (s) => s.started);
  await until(page, (s) => s.pixel.grounded);
}

async function bed(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 185);
  await move(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 404) < 2);
  await move(page, ['Space'], (s) => s.pixel.bottom <= 344);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 393);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 340) < 2);
}

async function underBed(page: Page) {
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 480);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 620);
  await move(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
}

async function catBed(page: Page) {
  await bed(page);
  await underBed(page);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 470);
}

test('Regal-Slots: belegte Regale, Bilder und erreichbare Grünlilie verwenden echte Spielobjekte', async ({
  page,
}) => {
  await bedroom(page);
  const initial = await observe(page);

  expect(initial.vases).toHaveLength(3);
  expect(initial.books).toHaveLength(1);
  expect(initial.pictures).toHaveLength(2);
  expect(initial.plants).toHaveLength(1);
  expect(initial.plants[0]).toMatchObject({
    appearance: 'spiderplant',
    texture: 'bedroom-spiderplant-intact',
    supportY: 190,
  });
  expect(initial.shelves.map((shelf) => shelf.id)).toEqual(
    expect.arrayContaining(['bedroom-lower-shelf', 'bedroom-upper-shelf', 'wardrobe']),
  );
  await bed(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 600);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 735);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 270) < 2);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 840);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 190) < 2);
  await until(page, (s) => s.plants[0].state === 'tipped');
  const tipped = await observe(page);

  expect(tipped.plants[0]).toMatchObject({
    texture: 'bedroom-spiderplant-bitten',
    soilVisible: true,
    events: 2,
  });
  expect(tipped.album.pending).toContain('plant.spiderplant');
  await move(page, ['r'], (s) => s.generation > tipped.generation);
  expect((await observe(page)).plants[0]).toMatchObject({
    texture: 'bedroom-spiderplant-intact',
    soilVisible: false,
    events: 0,
  });
  expect((await observe(page)).chaos.score).toBe(0);
});

test('Lampe und Läufer: echter Bruch, Teppichaktion, Versöhnung und gemeinsame Albumfunde', async ({
  page,
}) => {
  await bedroom(page);
  await bed(page);
  await move(page, ['ArrowLeft'], (s) => s.lamps[0].state === 'broken');
  const broken = await observe(page);

  expect(broken.lamps[0].shards).toBe(7);
  expect(broken.chaos.score).toBe(20);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 100);
  await bed(page);
  await underBed(page);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 350);
  await until(page, (s) => s.carpets[0].state === 'soiled');
  const soiled = await observe(page);

  expect(soiled.carpets[0]).toMatchObject({
    events: 1,
    texture: 'bedroom-runner',
    hairballVisible: true,
  });
  expect(soiled.chaos.score).toBe(35);
  await page.clock.runFor(500);
  expect((await observe(page)).chaos.score).toBe(35);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 470);
  await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
  expect((await observe(page)).homecoming.selection?.peaceful).toBe(false);
  await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
  await finishCharm(page, true);
  await until(page, (s) => s.result !== null);
  const completed = await observe(page);

  expect(completed.album.confirmed).toEqual(
    expect.arrayContaining(['lamp.bedside', 'carpet.bedroom-runner', 'goal.sleep-pad']),
  );
  await move(page, ['r'], (s) => s.generation > completed.generation);
  expect((await observe(page)).lamps[0].state).toBe('resting');
  expect((await observe(page)).carpets[0]).toMatchObject({
    state: 'idle',
    hairballVisible: false,
    events: 0,
  });
});

test('Kurze Khaki-Vorhänge: beide erreichbar, acht getrennte Risse, Pause, Absprung und Reset', async ({
  page,
}) => {
  await bedroom(page);
  await bed(page);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.climbing);

  for (let stage = 1; stage <= 8; stage++) {
    await move(page, ['ArrowUp'], (s) => s.pixel.top <= 104);
    await until(page, (s) => s.curtains[1].damage === stage);

    if (stage === 1) {
      const before = await observe(page);

      await page.locator('.pause-toggle').click();
      await page.clock.runFor(1500);
      expect((await observe(page)).curtains).toEqual(before.curtains);
      await page.locator('[data-pause-resume]').click();
      await page.locator('#game').focus();
    }
  }

  expect((await observe(page)).curtains[1]).toMatchObject({
    texture: 'bedroom-curtain',
    events: 8,
  });
  expect((await observe(page)).curtains[1].marks).toHaveLength(8);
  await move(page, ['ArrowUp'], (s) => s.pixel.top <= 104);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 230 && s.pixel.climbing);
  await move(page, ['ArrowUp'], (s) => s.pixel.top <= 104);
  await until(page, (s) => s.curtains[0].damage >= 1);
  expect((await observe(page)).album.pending.filter((id) => id === 'curtain.khaki')).toHaveLength(
    1,
  );
  await page
    .locator('#game')
    .screenshot({ path: test.info().outputPath('pixels-58-khaki-curtains-torn.png') });
  const initial = await observe(page);

  await move(page, ['r'], (s) => s.generation > initial.generation);
  expect((await observe(page)).curtains.every((c) => c.damage === 0 && c.marks.length === 0)).toBe(
    true,
  );
});

test('Wäschekorb gegen Wäschekorb: gleiche Varianten, begrenzte Kette und Reset über den öffentlichen Editor', async ({
  page,
}) => {
  await loadScenario(page, 'empty');
  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  await page.getByLabel('Objekt zum Spawnen').selectOption('laundry-basket');

  for (const x of [360, 500]) {
    await page.getByLabel('X', { exact: true }).fill(String(x));
    await page.getByRole('button', { name: 'Spawnen', exact: true }).click();
    await untilPlayground(page, (s) => s.pixel.grounded);
  }

  await page.locator('#game').focus();
  await movePlayground(page, ['ArrowRight'], (s) => s.pixel.x >= 270);
  await movePlayground(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 358);
  await movePlayground(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await untilPlayground(page, (s) => s.laundry[0].occupied && s.pixel.grounded);
  await movePlayground(page, ['ArrowRight'], (s) => s.laundry[1].stage >= 1);
  await untilPlayground(page, (s) => s.laundry.every((item) => item.stage === 2));
  const ended = await snapshot(page);

  expect(ended.laundry[1]).toMatchObject({ occupied: false, events: 2, toppledBy: 'spawn-1' });
  expect(ended.chaos.score).toBe(40);
  await page.clock.runFor(1000);
  expect((await snapshot(page)).chaos.score).toBe(40);
  await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
  await untilPlayground(page, (s) =>
    s.laundry.every((item) => item.events === 0 && item.stage === 0),
  );
});

test('Schlafzimmer: öffentlicher friedlicher Schlafplatz, Pause und bestätigter Albumfund @smoke', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('pixels-world.difficulty', 'hard'));
  await bedroom(page, true);
  await catBed(page);
  await page.screenshot({ path: test.info().outputPath('pixels-58-bedroom.png') });
  await until(page, (s) => s.goalRest.active);
  const resting = await observe(page);

  expect(resting.pixel.visualTexture).toBe('pixel-charm');
  expect([6, 7, 8, 9, 10, 11]).toContain(resting.pixel.visualFrame);
  expect(resting.goal.status).toBe('reached');
  expect(resting.goalView.texture).toBe('sleep-pad');
  expect(resting.chaos.damagedObjects).toBe(0);
  expect(resting.album.pending).toContain('goal.sleep-pad');
  await page.locator('.pause-toggle').click();
  await page.clock.runFor(3000);
  expect((await observe(page)).goalRest).toEqual(resting.goalRest);
  await page.locator('[data-pause-resume]').click();
  await until(page, (s) => s.homecoming.stage === 'entering');
  const entering = await observe(page);

  expect(entering.pixel.visualTexture).toBe('pixel-charm');
  expect([8, 9, 10, 11]).toContain(entering.pixel.visualFrame);
  await page.clock.runFor(500);
  expect((await observe(page)).pixel.x).toBeCloseTo(resting.pixel.x, 1);
  expect((await observe(page)).sara).toMatchObject({ visible: true, fallbackDoorVisible: false });
  await page
    .locator('#game')
    .screenshot({ path: test.info().outputPath('pixels-58-bedroom-white-door-homecoming.png') });
  await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
  await move(page, ['Space'], (s) => s.result !== null);
  const ended = await observe(page);

  expect(ended.result).toMatchObject({
    outcome: 'success',
    peaceful: true,
    goalReached: true,
    score: 0,
  });
  expect(ended.album.confirmed).toContain('goal.sleep-pad');
  expect(ended.result?.closingLine).toContain('Katzenbett');
  expect(ended.reconciliation.stage).toBe('waiting');
  await page.screenshot({ path: test.info().outputPath('pixels-58-bedroom-peaceful.png') });
});

test('Schlafzimmer: Wäsche zerwühlen, herunterschieben und Korb durch echte Kette kippen; Reset räumt auf', async ({
  page,
}) => {
  await bedroom(page);
  await bed(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 600);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 510);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 600);
  await until(page, (s) => s.laundry[0].stage === 2);
  await until(page, (s) => s.laundry[0].y === 468 && s.laundry[1].stage === 2);
  const damaged = await observe(page);

  expect(damaged.laundry[0].events).toBe(2);
  expect(damaged.laundry[1]).toMatchObject({
    events: 2,
    occupied: false,
    toppledBy: 'folded-laundry',
  });
  expect(damaged.chaos.score).toBe(40);
  await page.clock.runFor(1000);
  expect((await observe(page)).chaos.score).toBe(40);
  await move(page, ['r'], (s) => s.generation > damaged.generation);
  expect((await observe(page)).laundry.every((item) => item.stage === 0 && item.events === 0)).toBe(
    true,
  );
});

test('Schlafzimmer: in den Korb springen, bewegen und jederzeit wieder herausspringen', async ({
  page,
}) => {
  await bedroom(page);
  await bed(page);
  await underBed(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 690);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 746);
  await until(page, (s) => s.laundry[1].occupied && s.pixel.grounded);
  await move(page, ['ArrowLeft'], (s) => s.laundry[1].stage >= 1);
  await move(page, ['Space'], (s) => !s.laundry[1].occupied && s.pixel.velocityY < 0);
  expect((await observe(page)).goal.status).toBe('active');
  await until(page, (s) => s.laundry[1].stage === 2);
  expect((await observe(page)).laundry[1].events).toBe(2);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test.describe(`Schlafzimmer mit Touch ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true });
    test('Katzenbett unter dem Bett über echte Touchsprünge erreichen; Pause hält das Nickerchen an', async ({
      page,
    }) => {
      await page.goto('/play.html');
      await waitForGame(page, false);
      await page.locator('[data-menu-play]').tap();
      await page.locator('[data-room-choice="bedroom"]').tap();
      await page.locator('[data-room-start]').tap();
      await until(page, (s) => s.room.id === 'bedroom' && s.intro.visible);
      const touch = await TouchDriver.create(page);

      await touch.tap('jump');
      await until(page, (s) => s.started && s.pixel.grounded);
      await touch.press('right', 1);
      await touch.tap('jump');
      await until(page, (s) => s.pixel.x >= 185);
      await touch.lift(1);
      await touch.press('left', 2);
      await until(page, (s) => s.pixel.velocityX <= 0);
      await touch.lift(2);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 404) < 2);
      await touch.tap('jump');
      await until(page, (s) => s.pixel.bottom <= 344);
      await touch.press('right', 1);
      await until(page, (s) => s.pixel.x >= 393);
      await touch.lift(1);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 340) < 2);
      await touch.press('right', 1);
      await until(page, (s) => s.pixel.x >= 480);
      await touch.lift(1);
      await touch.press('right', 1);
      await touch.tap('jump');
      await until(page, (s) => s.pixel.x >= 620);
      await touch.lift(1);
      await touch.press('left', 2);
      await until(page, (s) => s.pixel.velocityX <= 0);
      await touch.lift(2);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
      await touch.press('left', 2);
      await until(page, (s) => s.pixel.x <= 470);
      await touch.lift(2);
      await until(page, (s) => s.goalRest.active);
      await page.locator('.pause-toggle').tap();
      const paused = await observe(page);

      await page.clock.runFor(3000);
      expect((await observe(page)).goalRest).toEqual(paused.goalRest);
      await page.locator('[data-pause-resume]').tap();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: test.info().outputPath(`pixels-58-bedroom-mobile-${viewport.width}.png`),
      });
      expect((await observe(page)).chaos.score).toBe(0);
    });
  });
}
