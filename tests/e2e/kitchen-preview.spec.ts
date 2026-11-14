/* eslint-disable max-lines-per-function -- Die echte Sprungroute prüft alle Auflagen, Pause und Reset als zusammenhängenden Raumablauf. */
import { test, expect, waitForGame, waitForLoadingScreen } from './support';
import { observe, until, move, climbToCounter } from './kitchen-support';

for (const [difficulty, viewport] of [
  ['easy', { width: 1280, height: 900 }],
  ['normal', { width: 390, height: 844 }],
  ['hard', { width: 568, height: 320 }],
] as const) {
  test.describe(`Küchen-Grundraum ${difficulty}`, () => {
    test.use({ viewport });
    test(
      'Napf ist friedlich erreichbar; Fressanimation pausiert und lässt sich zurücksetzen',
      { tag: '@smoke' },
      async ({ page }, info) => {
        await page.addInitScript(
          (value) => localStorage.setItem('pixels-world.difficulty', value),
          difficulty,
        );
        await page.goto('/play.html?room=kitchen-preview');
        await waitForGame(page);
        await page.keyboard.down('Space');
        await until(page, (s) => s.started && s.pixel.grounded);
        await page.keyboard.up('Space');
        expect((await observe(page)).room.id).toBe('kitchen-preview');
        await climbToCounter(page);
        await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
        await until(page, (s) => s.foodEating.active);
        expect((await observe(page)).pixel.visualFlipX).toBe(true);
        await until(page, (s) => s.foodEating.phase === 'eat');
        const reached = await observe(page);

        expect(reached.goalView.kind).toBe('food');
        expect(reached.goalView.texture).toBe('food-bowl');
        expect(reached.ballPlay.active).toBe(false);
        expect(reached.homecoming.stage).toBe('waiting');
        expect(reached.album.pending).toContain('goal.food-bowl');
        expect([23, 24]).toContain(reached.pixel.visualFrame);
        expect(reached.pixel.visualFlipX).toBe(false);

        expect(reached.pictures).toHaveLength(difficulty === 'easy' ? 1 : 2);
        expect(reached.chaos.score).toBe(0);
        expect(reached.foodBags).toHaveLength(1);
        expect(reached.foodBags[0].state).toBe('upright');
        expect(
          reached.shelves.every((s) => s.enabled && s.damage === 0 && s.stability === 'stable'),
        ).toBe(true);
        await info.attach('kuechen-grundraum', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
        await page.keyboard.press('Escape');
        const paused = await observe(page);

        await page.clock.runFor(1000);
        expect((await observe(page)).round).toEqual(paused.round);
        expect((await observe(page)).foodEating).toEqual(paused.foodEating);
        expect((await observe(page)).pixel.visualFrame).toBe(paused.pixel.visualFrame);
        await page.locator('[data-pause-resume]').click();
        await move(page, ['r'], (s) => s.generation > reached.generation);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
        expect((await observe(page)).pixel.x).toBe(110);
        expect((await observe(page)).foodEating.active).toBe(false);
        expect((await observe(page)).album.pending).toEqual([]);
        expect((await observe(page)).shelves.every((s) => s.enabled && s.damage === 0)).toBe(true);
      },
    );
  });
}

test('Produktion ignoriert die Küchenvorschau und lässt die öffentliche Küche gesperrt', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4175/pixels-world/play.html?room=kitchen-preview');
  await waitForLoadingScreen(page);
  await expect(page.locator('h1 span').first()).toContainText('WOHNZIMMER');
  await page.locator('[data-menu-play]').click();
  await expect(page.locator('.room-choice').filter({ hasText: 'Küche' })).toBeDisabled();
  expect(await page.evaluate(() => typeof window.__pixelTest)).toBe('undefined');
});

test(
  'Sara kommt in der Küche von links; Pixel kehrt von der Arbeitsplatte sicher zu ihr zurück',
  { tag: '@smoke' },
  async ({ page }, info) => {
    await page.goto('/play.html?room=kitchen-preview&camera=room');
    await waitForGame(page);
    await page.keyboard.down('Space');
    await until(page, (s) => s.started && s.pixel.grounded);
    await page.keyboard.up('Space');
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.goal.status === 'reached');
    await until(page, (s) => s.foodEating.phase === 'eat');
    expect((await observe(page)).homecoming.stage).toBe('waiting');
    await info.attach('pixel-frisst', { body: await page.screenshot(), contentType: 'image/png' });
    await until(page, (s) => s.homecoming.stage === 'entering');
    const entering = await observe(page);

    expect(entering.sara.x).toBeLessThan(114);
    expect(entering.sara.flipX).toBe(true);
    expect(entering.pixelReturn.targetX).toBe(178);
    await page.keyboard.press('Escape');
    const paused = await observe(page);

    await page.clock.runFor(500);
    expect((await observe(page)).sara.x).toBe(paused.sara.x);
    await page.locator('[data-pause-resume]').click();
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    const seated = await observe(page);

    expect(seated.sara.x).toBe(114);
    expect(seated.pixel.flipX).toBe(true);
    expect(Math.abs(seated.pixel.x - 178)).toBeLessThanOrEqual(4);
    await info.attach('sara-von-links', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await move(page, ['Space'], (s) => s.result !== null);
    await page.clock.runFor(1000);
    const ending = await observe(page);

    expect(ending.result?.outcome).toBe('success');
    expect(ending.result?.peaceful).toBe(true);
    expect(ending.album.confirmed).toContain('goal.food-bowl');
    await expect(page.locator('.album-banner')).toHaveAttribute('data-entry', 'goal.food-bowl');
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.storage'))).toBeNull();
    expect(ending.sara.flipX).toBe(true);
    expect(ending.sara.x).toBeLessThan(ending.pixel.x);
    expect(ending.pixel.visualFlipX).toBe(true);
  },
);

test('Beide festen Küchenregale sind über den Tisch erreichbar', async ({ page }, info) => {
  await page.goto('/play.html?room=kitchen-preview&camera=room');
  await waitForGame(page);
  await page.keyboard.down('Space');
  await until(page, (s) => s.started && s.pixel.grounded);
  await page.keyboard.up('Space');
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 255);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 398) < 2);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 430);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 328) < 2);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 500);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 330);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 218) < 2);
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 90);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 202) < 2);
  expect((await observe(page)).shelves.every((s) => s.enabled && s.damage === 0)).toBe(true);
  await info.attach('kuechenregale', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('Reduzierte Bewegung hält Kopf und Napf beim Fressen ruhig; Fokusverlust hält aktive Zeit an', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/play.html?room=kitchen-preview&camera=room');
  await waitForGame(page);
  await page.keyboard.down('Space');
  await until(page, (s) => s.started && s.pixel.grounded);
  await page.keyboard.up('Space');
  await climbToCounter(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
  await until(page, (s) => s.foodEating.phase === 'eat');
  const first = await observe(page);

  await page.clock.runFor(450);
  expect((await observe(page)).pixel.visualFrame).toBe(23);
  expect((await observe(page)).pixel.visualX).toBe(first.pixel.visualX);
  expect((await observe(page)).goalView.ballX).toBe(first.goalView.ballX);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await observe(page);

  await page.clock.runFor(1000);
  expect((await observe(page)).foodEating).toEqual(paused.foodEating);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await until(page, (s) => s.homecoming.stage === 'entering');
});
