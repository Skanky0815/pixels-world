import { test, expect, state, start, until, reset, besideCouch } from './support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from './round-clock';

test('Grobe Zeithinweise führen zur einmaligen Heimkehr und einem eingefrorenen Chaosstand', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Das vollständige Rundenszenario behält Vorbereitung, echte Eingaben und gemeinsame Zustandsprüfungen zusammen.
}) => {
  await seedRoundRandom(page);
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage > 0);
  const initial = await state(page);

  expect(initial.round.returnAtMs).toBeGreaterThanOrEqual(60_000);
  expect(initial.round.returnAtMs).toBeLessThanOrEqual(105_000);
  expect(initial.hud.roundText).toBe('Noch etwas Zeit');
  await useIdleFrames(page);
  await advanceRoundTo(page, initial.round.returnAtMs * 0.61);
  expect((await state(page)).hud.roundText).toBe('Sara könnte bald kommen');
  await advanceRoundTo(page, initial.round.returnAtMs * 0.86);
  expect((await state(page)).hud.roundText).toBe('Jeden Moment …');
  await advanceRoundTo(page, initial.round.returnAtMs);
  const finished = await state(page);

  test.info().annotations.push({
    type: 'round-simulation',
    description: JSON.stringify({
      durationMs: initial.round.returnAtMs,
      frames: finished.frame - initial.frame,
    }),
  });
  expect(finished.round.phase).toBe('returning');
  expect(finished.round.finalChaosScore).toBe(finished.chaos.score);
  expect(finished.chaos.score).toBeGreaterThan(0);
  expect(finished.hud.roundText).toBe('Sara kommt herein … · R: Neue Runde');
  expect(finished.homecoming.stage).toBe('entering');
  expect(finished.homecoming.selection?.score).toBe(finished.round.finalChaosScore);
  expect(finished.sara.visible).toBe(true);
  expect(finished.sara.animationKey).toBe('sara-enter');
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.round))).toBe(true);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(2000);
  const later = await state(page);

  expect(later.pixel).toEqual(finished.pixel);
  expect(later.chaos).toEqual(finished.chaos);
  expect(later.objects).toEqual(finished.objects);
  expect(later.round).toEqual({ ...finished.round, phase: 'reaction' });
  expect(later.homecoming.stage).toBe('reacting');
  expect(later.homecoming.selection).toEqual(finished.homecoming.selection);
  expect(later.sara.x).toBeLessThan(finished.sara.x);
  expect(later.sara.animationKey).toBe(finished.homecoming.selection?.animationKey);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await state(page);

  await page.clock.runFor(10_000);
  expect((await state(page)).homecoming).toEqual(paused.homecoming);
  expect((await state(page)).sara).toEqual(paused.sara);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await until(page, (s) => s.homecoming.stage === 'dialogue');
  const dialogue = await state(page);

  expect(dialogue.sara.dialogueText).toContain(finished.homecoming.selection?.dialogue);
  await test.info().attach('sara-dialogue', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.homecoming.selection))).toBe(
    true,
  );
  await page.clock.runFor(4000);
  await until(page, (s) => s.homecoming.stage === 'complete');
  const complete = await state(page);

  expect(complete.round.phase).toBe('reconciliation');
  expect(complete.homecoming.stage).toBe('complete');
  expect(complete.sara.animationKey).toBe('sara-idle');
  expect(complete.sara.dialogueText).toContain('VERSÖHNUNG');
  expect(complete.hud.scoreText).not.toContain('VORSCHAU');
  await test.info().attach('reconciliation-placeholder', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  expect(complete.pixel).toEqual(finished.pixel);
  expect(complete.chaos).toEqual(finished.chaos);
  expect(complete.objects).toEqual(finished.objects);
  await page.clock.runFor(2000);
  expect((await state(page)).homecoming).toEqual(complete.homecoming);
  expect((await state(page)).round).toEqual(complete.round);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
  await reset(page);
  const fresh = await state(page);

  expect(fresh.round.phase).toBe('chaos');
  expect(fresh.round.elapsedMs).toBeLessThan(500);
  expect(fresh.round.finalChaosScore).toBeNull();
  expect(fresh.hud.roundText).toBe('Noch etwas Zeit');
  expect(fresh.chaos.score).toBe(0);
  expect(fresh.homecoming.stage).toBe('waiting');
  expect(fresh.homecoming.selection).toBeNull();
  expect(fresh.homecoming.elapsedMs).toBe(0);
  expect(fresh.sara.visible).toBe(false);
  expect(fresh.sara.dialogueText).toBe('');
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
