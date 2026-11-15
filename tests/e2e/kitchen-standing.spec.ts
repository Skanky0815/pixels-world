/* eslint-disable max-lines-per-function -- Reale Kletterroute und mehrere Sekunden Stillstand prüfen den Physik-/Animationsübergang gemeinsam. */
import { test, expect, waitForGame } from './support';
import { observe, move, climbToCounterLanding } from './kitchen-support';

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
    samples.push((await observe(page)).pixel);
  }

  await test.info().attach('Arbeitsplatte-Zustände', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  });
  expect(samples.every((p) => p.grounded && p.animation === 'idle')).toBe(true);
  expect(
    Math.max(...samples.map((p) => p.visualY)) - Math.min(...samples.map((p) => p.visualY)),
  ).toBeLessThan(0.5);
});
