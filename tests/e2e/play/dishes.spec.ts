/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect } from '../support/support';
import { TouchDriver } from '../support/touch-support';
import { observe, until, move } from './playground-object-support';
import { loadScenario, togglePause, resume } from './playground-object-support';

for (const room of ['dish-cups', 'dish-plates', 'dish-mixed'])
  test(
    `Geschirr ${room}: Schubsen, Fremdkontakt, einmaliger Fallbruch und Reset`,
    { tag: '@smoke' },
    async ({ page }, info) => {
      await loadScenario(page, room);
      const initial = await observe(page);

      expect(initial.dishes.every((dish) => dish.state === 'resting')).toBe(true);
      await move(page, ['ArrowRight'], (s) => s.dishes[0].state === 'moving');
      expect((await observe(page)).chaos.score).toBe(0);
      await until(page, (s) => s.dishes[1].state !== 'resting');
      await togglePause(page);
      const paused = await observe(page);

      await page.clock.runFor(700);
      expect((await observe(page)).dishes).toEqual(paused.dishes);
      await resume(page);
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

      for (const appearance of ['cup', 'plate'])
        expect(broken.discoveries.includes(`dish.${appearance}`)).toBe(
          broken.dishes.some((dish) => dish.appearance === appearance && dish.state === 'broken'),
        );
      expect(broken.pixel.x).toBeLessThan(192);
      await info.attach(room, { body: await page.screenshot(), contentType: 'image/png' });
      await page.clock.runFor(1000);
      expect((await observe(page)).chaos.score).toBe(broken.chaos.score);
      await move(page, ['r'], (s) => s.generation > initial.generation);
      expect(
        (await observe(page)).dishes.map((dish) => [dish.x, dish.y, dish.state, dish.shards]),
      ).toEqual(initial.dishes.map((dish) => [dish.x, dish.y, dish.state, dish.shards]));
      expect((await observe(page)).discoveries).toEqual([]);
    },
  );

test('Bücher stoßen Geschirr ohne direkte Pixelberührung an', async ({ page }) => {
  await loadScenario(page, 'dish-incoming');
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 125);
  await until(page, (s) => s.books[0].state === 'falling');
  await until(page, (s) => s.dishes[0].state !== 'resting');
  expect((await observe(page)).pixel.x).toBeLessThan(150);
});

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
      await loadScenario(page, 'dish-cups');
      const touch = await TouchDriver.create(page);

      await until(page, (s) => s.pixel.grounded);
      await touch.press('right');
      await until(page, (s) => s.dishes[0].state === 'moving');
      await touch.lift();
      await until(page, (s) => s.dishes.some((dish) => dish.state === 'broken'));
      expect((await observe(page)).discoveries).toContain('dish.cup');
    });
});
