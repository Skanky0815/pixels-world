/* eslint-disable max-lines-per-function -- Reale Kletterroute und mehrere Sekunden Stillstand prüfen den Physik-/Animationsübergang gemeinsam. */
import { test, expect, waitForGame } from './support';
import { observe, move, climbToCounterLanding } from './kitchen-support';

for (const mobile of [false, true])
  test.describe(mobile ? 'Handykamera' : 'Desktopkamera', () => {
    test.use({
      hasTouch: mobile,
      isMobile: mobile,
      deviceScaleFactor: mobile ? 3 : 1,
      viewport: mobile ? { width: 844, height: 390 } : { width: 1366, height: 900 },
    });
    test('Pixel steht auf der Arbeitsplatte ruhig, ohne zwischen Luft- und Standpose zu zittern @smoke', async ({
      page,
    }) => {
      await page.goto('/play.html?room=kitchen&room-seed=pantry-easy-1');
      await waitForGame(page);
      await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
      await climbToCounterLanding(page);
      await page.clock.runFor(400);
      const samples = [];

      for (let i = 0; i < 240; i++) {
        await page.clock.runFor(8);
        const state = await observe(page);

        samples.push({ ...state.pixel, camera: state.camera });
      }

      await test.info().attach('Arbeitsplatte-Zustände', {
        body: JSON.stringify(samples),
        contentType: 'application/json',
      });
      expect(samples.every((p) => p.grounded && p.animation === 'idle')).toBe(true);

      for (const axis of ['x', 'y'] as const)
        expect(
          Math.max(...samples.map((p) => p.camera[axis])) -
            Math.min(...samples.map((p) => p.camera[axis])),
        ).toBeLessThan(0.1);
      expect(
        Math.max(...samples.map((p) => p.visualY)) - Math.min(...samples.map((p) => p.visualY)),
      ).toBeLessThan(0.5);
    });
  });
