/* eslint-disable max-lines-per-function -- Echte Stöße, Fallketten und deren Pause/Reset werden als vollständige Spielabläufe geprüft. */
import { test, expect, waitForGame } from './support';
import { TouchDriver } from './touch-support';
import { observe, until, move, climbToCounter } from './kitchen-support';

for (const room of ['dish-cups', 'dish-plates', 'dish-mixed'])
  test(
    `Geschirr ${room}: Schubsen, Fremdkontakt, einmaliger Fallbruch und Reset`,
    { tag: '@smoke' },
    async ({ page }, info) => {
      await page.goto(`/play.html?room=${room}&camera=room`);
      await waitForGame(page);
      await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
      const initial = await observe(page);

      expect(initial.dishes.every((dish) => dish.state === 'resting')).toBe(true);
      await move(page, ['ArrowRight'], (s) => s.dishes[0].state === 'moving');
      expect((await observe(page)).chaos.score).toBe(0);
      await until(page, (s) => s.dishes[1].state !== 'resting');
      await page.keyboard.press('Escape');
      const paused = await observe(page);

      await page.clock.runFor(700);
      expect((await observe(page)).dishes).toEqual(paused.dishes);
      await page.locator('[data-pause-resume]').click();
      await move(page, ['r'], (s) => s.generation > initial.generation);
      await until(page, (s) => s.pixel.grounded);
      expect(
        (await observe(page)).dishes.every((dish) => dish.state === 'resting' && dish.shards === 0),
      ).toBe(true);
      expect((await observe(page)).chaos.score).toBe(0);
      await move(page, ['ArrowRight'], (s) => s.dishes[0].state === 'moving');
      await until(page, (s) => s.dishes.some((dish) => dish.state === 'broken'));
      await page.clock.runFor(1600);
      const broken = await observe(page);

      if (room === 'dish-mixed') expect(broken.foodBags[0].state).toBe('spilled');

      expect(
        broken.dishes.filter((dish) => dish.state === 'broken').every((dish) => dish.shards === 7),
      ).toBe(true);
      expect(broken.album.pending).toContain(room === 'dish-plates' ? 'dish.plate' : 'dish.cup');
      expect(broken.pixel.x).toBeLessThan(192);
      await info.attach(room, { body: await page.screenshot(), contentType: 'image/png' });
      await page.clock.runFor(1000);
      expect((await observe(page)).chaos.score).toBe(broken.chaos.score);
      await move(page, ['r'], (s) => s.generation > initial.generation);
      expect(
        (await observe(page)).dishes.map((dish) => [dish.x, dish.y, dish.state, dish.shards]),
      ).toEqual(initial.dishes.map((dish) => [dish.x, dish.y, dish.state, dish.shards]));
      expect((await observe(page)).album.pending).toEqual([]);
    },
  );

test('Bücher stoßen Geschirr ohne direkte Pixelberührung an', async ({ page }) => {
  await page.goto('/play.html?room=dish-incoming');
  await waitForGame(page);
  await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 125);
  await until(page, (s) => s.books[0].state === 'falling');
  await until(page, (s) => s.dishes[0].state !== 'resting');
  expect((await observe(page)).pixel.x).toBeLessThan(150);
});

test(
  'Öffentliche Küche wählen, friedlich abschließen und Küchen-Erfolg erhalten',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pixels-world.difficulty', 'hard'));
    await page.goto('/play.html');
    await waitForGame(page, false);
    await page.locator('[data-menu-play]').click();
    await page.locator('[data-room-choice="kitchen"]').click();
    await expect(page.locator('[data-room-choice="kitchen"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('[data-room-choice="living-room"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.locator('[data-room-start="kitchen"]').click();
    await until(page, (s) => s.room.id === 'kitchen');
    await page.locator('#game').focus();
    await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
    expect((await observe(page)).room.id).toBe('kitchen');
    await page.clock.runFor(32);
    await climbToCounter(page);
    await move(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    await move(page, ['Space'], (s) => s.result !== null);
    const result = await observe(page);

    expect(result.chaos.score).toBe(0);
    expect(result.result?.peaceful).toBe(true);
    await expect(page.locator('.album-banner')).toHaveAttribute('data-entry', 'goal.food-bowl');
    await page.clock.runFor(3100);
    await expect(page.locator('.album-banner')).toHaveAttribute(
      'data-entry',
      'achievement.peaceful-kitchen-v1',
    );
    expect(result.album.confirmed).toContain('goal.food-bowl');
    expect(result.dishes.every((dish) => dish.state === 'resting')).toBe(true);
  },
);

test.describe('Geschirr mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ])
    test(`Tasse mit echten Bildschirmtasten bei ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/play.html?room=dish-cups');
      await waitForGame(page);
      const touch = await TouchDriver.create(page);

      await touch.press('jump');
      await until(page, (s) => s.started);
      await touch.lift();
      await until(page, (s) => s.pixel.grounded);
      await touch.press('right');
      await until(page, (s) => s.dishes[0].state === 'moving');
      await touch.lift();
      await until(page, (s) => s.dishes.some((dish) => dish.state === 'broken'));
      expect((await observe(page)).album.pending).toContain('dish.cup');
    });
});
