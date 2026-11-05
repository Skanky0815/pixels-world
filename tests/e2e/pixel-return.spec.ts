import { test, expect, state, start, until, couch, curtain, holdUntil, reset } from './support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';

const fullRound = process.env.E2E_FULL_ROUND === '1';
const tag = fullRound ? '@slow' : '@fast';
const path = fullRound ? '/' : '/?round-profile=fast';

for (const place of ['Regal', 'Vorhang'] as const) {
  test(
    `Pixel kommt nach Rundenende vom ${place} zu Sara und bleibt sitzen`,
    { tag },
    // eslint-disable-next-line max-lines-per-function -- Echter Weg zum Ausgangspunkt, Heimkehr und unveränderte Schadenswelt werden gemeinsam geprüft.
    async ({ page }) => {
      await seedRoundRandom(page);
      await start(page, path);

      if (place === 'Regal') {
        await couch(page);
        await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 410);
        await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 555);
        await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
      } else await curtain(page);
      expect((await state(page)).pixel.bottom).toBeLessThan(468);
      await useIdleFrames(page);
      await advanceRoundTo(page, (await state(page)).round.returnAtMs);
      const finished = await state(page);

      await until(
        page,
        (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
        500,
      );
      const seated = await state(page);

      expect(Math.abs(seated.pixel.x - (seated.sara.x - 64))).toBeLessThanOrEqual(4);
      expect(seated.pixel.bottom).toBeCloseTo(468, 0);
      expect(seated.pixel.grounded).toBe(true);
      expect(seated.pixel.climbing).toBe(false);
      expect(seated.pixel.animation).toBe('idle');
      expect(seated.pixel.velocityX).toBe(0);
      expect(seated.pixel.velocityY).toBe(0);
      expect(seated.chaos).toEqual(finished.chaos);
      expect(seated.objects).toEqual(finished.objects);
      expect(seated.vases).toEqual(finished.vases);
      expect(seated.homecoming.stage).toBe('dialogue');
      await page.clock.runFor(3000);
      expect((await state(page)).homecoming).toEqual(seated.homecoming);
      await test.info().attach(`pixel-bei-sara-${place}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    },
  );
}

test(
  'R beendet die automatische Heimkehr auch im zweiten Raum ohne alte Route',
  { tag },
  // eslint-disable-next-line max-lines-per-function -- Neustart während automatischer Bewegung und späterer Stillstand prüfen gemeinsam den Callback-/Routen-Lifecycle.
  async ({ page }) => {
    await seedRoundRandom(page);
    await start(page, fullRound ? '/?room=cozy-remix' : '/?room=cozy-remix&round-profile=fast');
    await useIdleFrames(page);
    await advanceRoundTo(page, (await state(page)).round.returnAtMs);
    await page.clock.runFor(200);
    expect((await state(page)).pixelReturn.stage).toBe('walking');
    await reset(page);
    await page.clock.runFor(500);
    const fresh = await state(page);

    expect(fresh.pixelReturn.stage).toBe('waiting');
    expect(fresh.pixelReturn.waypointX).toBeNull();
    expect(fresh.homecoming.stage).toBe('waiting');
    expect(fresh.homecoming.selection).toBeNull();
    expect(fresh.chaos.score).toBe(0);
    expect(fresh.pixel.x).toBeCloseTo(110, 0);
    expect(fresh.pixel.velocityX).toBe(0);
    expect(fresh.sara.visible).toBe(false);
  },
);
