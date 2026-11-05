import { test, expect, state, start, until, reset, besideCouch } from './support';

test('Grobe Zeithinweise führen zur einmaligen Heimkehr und einem eingefrorenen Chaosstand', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Das vollständige Rundenszenario behält Vorbereitung, echte Eingaben und gemeinsame Zustandsprüfungen zusammen.
}) => {
  // A complete round simulates up to 105 seconds at real physics-frame granularity.
  test.setTimeout(180_000);
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage > 0);
  const initial = await state(page);

  expect(initial.round.returnAtMs).toBeGreaterThanOrEqual(60_000);
  expect(initial.round.returnAtMs).toBeLessThanOrEqual(105_000);
  expect(initial.hud.roundText).toBe('Noch etwas Zeit');
  await page.clock.runFor(initial.round.returnAtMs * 0.61 - initial.round.elapsedMs);
  expect((await state(page)).hud.roundText).toBe('Sara könnte bald kommen');
  await page.clock.runFor(initial.round.returnAtMs * 0.25);
  expect((await state(page)).hud.roundText).toBe('Jeden Moment …');
  await page.clock.runFor(initial.round.returnAtMs * 0.15);
  const finished = await state(page);

  expect(finished.round.phase).toBe('returning');
  expect(finished.round.finalChaosScore).toBe(finished.chaos.score);
  expect(finished.chaos.score).toBeGreaterThan(0);
  expect(finished.hud.roundText).toBe('Sara ist zu Hause! · R: Neue Runde');
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.round))).toBe(true);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(2000);
  const later = await state(page);

  expect(later.pixel).toEqual(finished.pixel);
  expect(later.chaos).toEqual(finished.chaos);
  expect(later.objects).toEqual(finished.objects);
  expect(later.round).toEqual(finished.round);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
  await reset(page);
  const fresh = await state(page);

  expect(fresh.round.phase).toBe('chaos');
  expect(fresh.round.elapsedMs).toBeLessThan(500);
  expect(fresh.round.finalChaosScore).toBeNull();
  expect(fresh.hud.roundText).toBe('Noch etwas Zeit');
  expect(fresh.chaos.score).toBe(0);
});

// eslint-disable-next-line max-lines-per-function -- Das vollständige Rundenszenario behält Vorbereitung, echte Eingaben und gemeinsame Zustandsprüfungen zusammen.
test('Fokusverlust pausiert die Runde ohne Nachholen der Hintergrundzeit', async ({ page }) => {
  await start(page);
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await state(page);

  expect(paused.active).toBe(false);
  expect(paused.hud.roundText).toBe('Pause · Runde angehalten');
  await page.clock.runFor(20_000);
  const background = await state(page);

  expect(background.round).toEqual(paused.round);
  expect(background.pixel).toEqual(paused.pixel);
  expect(background.chaos).toEqual(paused.chaos);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.keyboard.up('Space');
  await page.clock.runFor(100);
  const resumed = await state(page);

  expect(resumed.active).toBe(true);
  expect(resumed.round.elapsedMs - paused.round.elapsedMs).toBeLessThan(200);
  await until(page, (s) => s.pixel.grounded);
});

// eslint-disable-next-line max-lines-per-function -- Zusammenhängender Visibility-Vertrag mit zeitlicher Zustandsprüfung.
test('Visibility pausiert unabhängig vom Fokus und erlaubt Resume', async ({ page }) => {
  const setHidden = async (hidden: boolean) => {
    await page.evaluate((value) => {
      // Headless Chromium keeps every page visible. Simulate only the browser boundary;
      // never write game state or expose an engine object through the observer.
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  };

  await start(page);
  await setHidden(true);
  const paused = await state(page);

  expect(paused.active).toBe(false);
  await page.clock.runFor(10_000);
  expect((await state(page)).round).toEqual(paused.round);
  await setHidden(false);
  await page.clock.runFor(100);
  const resumed = await state(page);

  expect(resumed.active).toBe(true);
  expect(resumed.generation).toBe(paused.generation);
  expect(resumed.round.elapsedMs - paused.round.elapsedMs).toBeLessThan(200);
});
