import { test, expect, state, start, until, reset, besideCouch } from './support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from './round-clock';
import { FAST_ROUND_CONFIG } from '../../tools/e2e-timing';
import { ROUND_CONFIG } from '../../src/game/domain/round-controller';
import { SARA_CLIPS } from '../../src/game/actors/sara-animations';

const fullRound = process.env.E2E_FULL_ROUND === '1';
const timing = fullRound ? ROUND_CONFIG : FAST_ROUND_CONFIG;

test(
  'Der Rundentimer führt ohne Zeithinweise zur einmaligen Heimkehr und friert Chaos ein',
  { tag: fullRound ? '@slow' : '@fast' },
  // eslint-disable-next-line max-lines-per-function -- Das vollständige Rundenszenario behält Vorbereitung, echte Eingaben und gemeinsame Zustandsprüfungen zusammen.
  async ({ page }) => {
    await seedRoundRandom(page);
    await start(page, fullRound ? '/' : '/?round-profile=fast');
    await besideCouch(page);
    await until(page, (s) => s.couch.damage > 0);
    const initial = await state(page);

    expect(initial.round.returnAtMs).toBeGreaterThanOrEqual(timing.minDurationMs);
    expect(initial.round.returnAtMs).toBeLessThanOrEqual(timing.maxDurationMs);
    expect(initial.round.hint).toBe('time');
    await useIdleFrames(page);
    await advanceRoundTo(page, initial.round.returnAtMs * 0.61);
    expect((await state(page)).round.hint).toBe('soon');
    await advanceRoundTo(page, initial.round.returnAtMs * 0.86);
    expect((await state(page)).round.hint).toBe('imminent');
    await advanceRoundTo(page, initial.round.returnAtMs);
    const finished = await state(page);

    test.info().annotations.push({
      type: 'round-simulation',
      description: JSON.stringify({
        profile: fullRound ? 'production-times' : 'short-test-config',
        durationMs: initial.round.returnAtMs,
        frames: finished.frame - initial.frame,
      }),
    });
    expect(finished.round.phase).toBe('returning');
    expect(finished.round.finalChaosScore).toBe(finished.chaos.score);
    expect(finished.chaos.score).toBeGreaterThan(0);
    expect(finished.homecoming.stage).toBe('entering');
    expect(finished.homecoming.selection?.score).toBe(finished.round.finalChaosScore);
    expect(finished.sara.visible).toBe(true);
    expect(finished.round.endReason).toBe('timer');
    expect(finished.goal.status).toBe('missed');
    expect(finished.sara.animationKey).toBe('sara-enter');
    expect(finished.sara.texture).toBe('sara');
    expect(SARA_CLIPS['sara-enter'].frames).toContain(finished.sara.frame);
    expect(finished.sara.soleY).toBe(468);
    expect(finished.sara.originY).toBe(90 / 96);
    expect(finished.sara.displayHeight).toBe(192);
    expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.round))).toBe(true);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.clock.runFor(2000);
    const later = await state(page);

    expect(later.pixel.x).toBeGreaterThan(finished.pixel.x);
    expect(later.pixelReturn.stage).toBe('walking');
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
    expect((await state(page)).pixel).toEqual(paused.pixel);
    expect((await state(page)).pixelReturn).toEqual(paused.pixelReturn);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await until(page, (s) => s.homecoming.stage === 'dialogue');
    const dialogue = await state(page);

    expect(dialogue.sara.frame).toBe(SARA_CLIPS[dialogue.sara.animationKey].frames.at(-1));
    expect(dialogue.sara.dialogueText).toContain(finished.homecoming.selection?.dialogue);
    await test.info().attach('sara-dialogue', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    expect(
      await page.evaluate(() => Object.isFrozen(window.__pixelTest?.homecoming.selection)),
    ).toBe(true);
    await until(page, (s) => s.pixelReturn.stage === 'seated', 500);
    const seated = await state(page);

    expect(Math.abs(seated.pixel.x - (seated.sara.x - 64))).toBeLessThanOrEqual(4);
    expect(seated.pixel.bottom).toBeCloseTo(468, 0);
    expect(seated.pixel.animation).toBe('idle');
    expect(seated.pixel.flipX).toBe(false);
    expect(seated.sara.dialogueText).toContain('␣: Weiter');
    await page.clock.runFor(10_000);
    expect((await state(page)).homecoming).toEqual(seated.homecoming);
    await page.keyboard.down('Space');
    await page.clock.runFor(200);
    expect((await state(page)).homecoming.stage).toBe('dialogue');
    await page.keyboard.up('Space');
    await page.keyboard.down('Space');
    await until(page, (s) => s.homecoming.stage === 'complete', 100);
    await page.keyboard.up('Space');
    const complete = await state(page);

    expect(complete.round.phase).toBe('reconciliation');
    expect(complete.homecoming.stage).toBe('complete');
    expect(complete.sara.animationKey).toBe('sara-idle');
    expect(complete.sara.dialogueText).toContain('VERSÖHNUNG');
    expect(complete.hud.scoreText).not.toContain('VORSCHAU');
    await test.info().attach('reconciliation-start', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    expect(complete.pixel.x).toBeCloseTo(seated.pixel.x, 1);
    expect(complete.pixel.bottom).toBeCloseTo(468, 0);
    expect(complete.pixel.velocityX).toBe(0);
    expect(complete.pixel.velocityY).toBe(0);
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
    expect(fresh.hud.scoreText).toBe('CHAOS: 0 · Normal');
    expect(fresh.chaos.score).toBe(0);
    expect(fresh.homecoming.stage).toBe('waiting');
    expect(fresh.homecoming.selection).toBeNull();
    expect(fresh.homecoming.elapsedMs).toBe(0);
    expect(fresh.pixelReturn.stage).toBe('waiting');
    expect(fresh.sara.visible).toBe(false);
    expect(fresh.sara.dialogueText).toBe('');
  },
);

// eslint-disable-next-line max-lines-per-function -- Das vollständige Rundenszenario behält Vorbereitung, echte Eingaben und gemeinsame Zustandsprüfungen zusammen.
test('Fokusverlust pausiert die Runde ohne Nachholen der Hintergrundzeit', async ({ page }) => {
  await start(page);
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await state(page);

  expect(paused.active).toBe(false);
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
