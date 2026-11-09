import { recordAudio, expectAudio, expectActiveAudio } from './audio-support';
import { test, expect, start, state, until, holdUntil, reset, couch } from './support';
import { startTouch } from './touch-support';
import { CARPET_RULES } from '../../src/game/interactions/carpet-hairball';
const rug = (s: Awaited<ReturnType<typeof state>>) => s.carpets[0];

for (const room of ['living-room', 'cozy-remix']) {
  // eslint-disable-next-line max-lines-per-function -- Anlauf, Abbruch, Pose, einmaliger Fleck, Albumereignis und Reset werden gemeinsam mit echten Wegen geprüft.
  test(`Teppich: Abbruch, Würgen und einmaliger Haarballen im ${room} @smoke`, async ({ page }) => {
    await recordAudio(page);
    await start(page, `/?room=${room}&room-seed=carpet-141`);
    await expectAudio(page, 0.56, 0);
    const initial = rug(await state(page));

    expect(initial).toMatchObject({
      state: 'idle',
      hairballVisible: false,
      damage: 0,
      texture: 'room-rug',
      hairballTexture: 'hairball',
    });
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 520);
    await until(page, (s) => s.pixel.velocityX === 0 && rug(s).state === 'waiting');
    await page.clock.runFor(1000);
    expect(rug(await state(page)).state).toBe('waiting');
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 720);
    await until(page, (s) => s.pixel.velocityX === 0);
    await page.clock.runFor(800);
    expect(rug(await state(page))).toMatchObject({
      state: 'idle',
      hairballVisible: false,
      events: 0,
    });
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 520);
    await until(page, (s) => rug(s).state === 'retching');
    await expectActiveAudio(page, 0.56, true);
    const active = await state(page);

    expect(active.pixel).toMatchObject({ animation: 'retch', bodyWidth: 52, bodyHeight: 52 });
    expect(active.albumDiscovery).toBeNull();
    await until(page, (s) => s.pixel.animationFrame !== active.pixel.animationFrame);

    if (room === 'living-room') {
      await page.keyboard.press('Escape');
      await expectActiveAudio(page, 0.56, false);
      const paused = rug(await state(page));

      await page.clock.runFor(2000);
      expect(rug(await state(page))).toEqual(paused);
      await page.keyboard.press('Escape');
    }

    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 230);
    await until(page, (s) => s.pixel.velocityX === 0);
    expect(rug(await state(page))).toMatchObject({
      state: 'idle',
      events: 0,
      hairballVisible: false,
    });
    await expectActiveAudio(page, 0.56, false);
    expect((await state(page)).chaos.score).toBe(0);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 520);
    await until(page, (s) => rug(s).state === 'soiled');
    await expectActiveAudio(page, 0.56, false);
    await expectAudio(page, 0.22, 1);
    const complete = await state(page);

    expect(rug(complete)).toMatchObject({
      hairballVisible: true,
      damage: 1,
      events: 1,
      lastDamage: { kind: 'hairball', value: CARPET_RULES.points },
    });
    expect(complete.chaos).toEqual({
      score: CARPET_RULES.points,
      damagedObjects: 1,
      anger: 'calm',
    });
    expect(complete.objects.filter((o) => o.kind === 'couch').every((o) => o.damage === 0)).toBe(
      true,
    );
    expect(complete.albumDiscovery).toMatchObject({
      entryId: 'carpet.hairball',
      objectId: 'living-room-rug',
    });
    expect(rug(complete).hairballX).toBeGreaterThanOrEqual(initial.area.x + 16);
    expect(rug(complete).hairballX).toBeLessThanOrEqual(initial.area.x + initial.area.width - 16);
    expect(rug(complete).hairballY).toBeLessThan(initial.area.y + initial.area.height);
    expect(
      await page.evaluate(
        () =>
          Object.isFrozen(window.__pixelTest?.carpets) &&
          Object.isFrozen(window.__pixelTest?.carpets[0].area),
      ),
    ).toBe(true);
    await page.clock.runFor(5000);
    expect(rug(await state(page))).toEqual(rug(complete));
    expect((await state(page)).chaos.score).toBe(CARPET_RULES.points);
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 230);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 520);
    await page.clock.runFor(5000);
    expect(rug(await state(page))).toEqual(rug(complete));
    expect((await state(page)).chaos.score).toBe(CARPET_RULES.points);
    await test.info().attach('haarballen-auf-dem-teppich', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await reset(page);
    await expectAudio(page, 0.22, 1);
    await expectActiveAudio(page, 0.56, false);
    expect(rug(await state(page))).toEqual(initial);
    expect((await state(page)).albumDiscovery).toBeNull();
  });
}

test('Teppich: Auf dem erhöhten Sofa bleibt das Kratzen erhalten und der Teppich sauber', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Das zusammenhängende Szenario prüft echte Bewegung und die dazugehörigen Zustände.
}) => {
  await start(page, '/?room-seed=carpet-141');
  await couch(page);
  await page.clock.runFor(CARPET_RULES.delayMs + CARPET_RULES.retchMs + 300);
  expect((await state(page)).couch.damage).toBeGreaterThan(0);
  expect(rug(await state(page))).toMatchObject({
    state: 'idle',
    damage: 0,
    hairballVisible: false,
  });
});

// eslint-disable-next-line max-lines-per-function -- Die mobile Konfiguration bleibt mit ihrem vollständigen Eingabeweg zusammen.
test.describe('Teppich mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });
  test('Springen bricht Würgen ab; erneutes Stehen erzeugt genau einen Haarballen', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Das zusammenhängende Szenario prüft echte Bewegung und die dazugehörigen Zustände.
  }) => {
    const touch = await startTouch(page, '/?room-seed=carpet-141');

    await touch.press('right');
    await until(page, (s) => s.pixel.x >= 520);
    await touch.lift();
    await until(page, (s) => rug(s).state === 'retching');
    expect((await state(page)).pixel.animation).toBe('retch');
    await touch.press('jump');
    await until(page, (s) => !s.pixel.grounded);
    await touch.lift();
    expect(rug(await state(page))).toMatchObject({
      state: 'idle',
      damage: 0,
      hairballVisible: false,
    });
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
    await until(page, (s) => rug(s).state === 'soiled');
    expect((await state(page)).chaos.score).toBe(CARPET_RULES.points);
    expect(rug(await state(page)).events).toBe(1);
  });
});
