import { recordAudio, expectAudio } from './audio-support';
import { test, expect, start, state, until, holdUntil, reset, couch } from './support';
import { startTouch } from './touch-support';
import { PICTURE_RULES } from '../../src/game/interactions/picture-falling';
import { PICTURE_ALBUM } from '../../src/content/album/pictures';

const fixtures = [
  ['living-room', 'pixel-portrait', 'pictures-4'],
  ['living-room', 'berlin-tower', 'pictures-7'],
  ['living-room', 'cozy-nook', 'pictures-2'],
  ['cozy-remix', 'pixel-portrait', 'pictures-1'],
  ['cozy-remix', 'berlin-tower', 'pictures-0'],
  ['cozy-remix', 'cozy-nook', 'pictures-3'],
] as const;
const picture = (s: Awaited<ReturnType<typeof state>>) =>
  s.pictures.find((p) => p.id === 'wall:sofa')!;

for (const [room, variant, seed] of fixtures) {
  const smoke = room === 'living-room' && variant === 'pixel-portrait' ? ' @smoke' : '';

  test(`Wandbild: ${variant} im ${room}, zwei Sprünge, Pause und Reset${smoke}`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Zwei echte Sprünge, Animation, Pause, einmaliger Schaden, Albumereignis und Reset bilden einen gemeinsamen Bildablauf.
  }) => {
    await recordAudio(page);
    await start(page, `/?room=${room}&room-seed=${seed}`);
    await expectAudio(page, 0.38, 0);
    const initial = picture(await state(page));

    expect(initial).toMatchObject({
      state: 'straight',
      damage: 0,
      angle: 0,
      texture: PICTURE_ALBUM[variant].asset,
    });
    expect((await state(page)).albumDiscovery).toBeNull();
    await couch(page);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 335);
    await until(page, (s) => s.pixel.velocityX === 0);
    expect(picture(await state(page)).state).toBe('straight');
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(page, (s) => picture(s).state === 'crooked');
    expect(picture(await state(page)).wobble).toBeGreaterThan(0);
    expect((await state(page)).albumDiscovery).toBeNull();

    if (room === 'living-room' && variant === 'pixel-portrait') {
      await page.keyboard.press('Escape');
      const paused = picture(await state(page));

      await page.clock.runFor(2000);
      expect(picture(await state(page))).toEqual(paused);
      await page.keyboard.press('Escape');
    }

    await until(page, (s) => s.pixel.grounded);
    await page.clock.runFor(200);
    expect(picture(await state(page))).toMatchObject({
      state: 'crooked',
      angle: -12,
      wobble: 0,
      events: 0,
    });
    expect((await state(page)).chaos.score).toBe(0);
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(page, (s) => picture(s).state === 'falling');
    expect(picture(await state(page)).events).toBe(0);
    await until(page, (s) => picture(s).state === 'fallen');
    await expectAudio(page, 0.38, 1);
    expect(picture(await state(page))).toMatchObject({
      damage: 1,
      events: 1,
      displayHeight: 26,
      lastDamage: { kind: 'picture-fall', value: PICTURE_RULES.points },
    });
    expect((await state(page)).chaos).toEqual({
      score: PICTURE_RULES.points,
      damagedObjects: 1,
      anger: 'calm',
    });
    expect((await state(page)).albumDiscovery).toMatchObject({
      entryId: PICTURE_ALBUM[variant].id,
      objectId: 'wall:sofa',
    });
    expect(
      await page.evaluate(
        () =>
          Object.isFrozen(window.__pixelTest?.pictures) &&
          Object.isFrozen(window.__pixelTest?.pictures[0]) &&
          Object.isFrozen(window.__pixelTest?.albumDiscovery),
      ),
    ).toBe(true);
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 265);
    await page.clock.runFor(1500);
    expect((await state(page)).chaos.score).toBe(PICTURE_RULES.points);
    expect(picture(await state(page)).events).toBe(1);
    await test
      .info()
      .attach(`${variant}-gefallen`, { body: await page.screenshot(), contentType: 'image/png' });
    await reset(page);
    await expectAudio(page, 0.38, 1);
    expect(picture(await state(page))).toEqual(initial);
    expect((await state(page)).albumDiscovery).toBeNull();
  });
}

// eslint-disable-next-line max-lines-per-function -- Die mobile Konfiguration und ihr vollständiger Eingabeweg bleiben zusammen.
test.describe('Wandbilder mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });
  // eslint-disable-next-line max-lines-per-function -- Zwei getrennte Mehrfinger-Sprünge prüfen denselben realen Kontaktvertrag auf Touch.
  test('Zwei echte Touch-Sprünge hängen das Pixel-Porträt ab', async ({ page }) => {
    const touch = await startTouch(page, '/?room-seed=pictures-4');

    await touch.press('right', 1);
    await touch.press('jump', 2);
    await until(page, (s) => s.pixel.x >= 265);
    await touch.lift(2);
    await touch.lift(1);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
    await touch.press('right');
    await until(page, (s) => s.pixel.x >= 335);
    await touch.lift();

    for (const expected of ['crooked', 'fallen']) {
      await touch.press('jump');
      await until(page, (s) => !s.pixel.grounded);
      await touch.lift();
      await until(page, (s) => picture(s).state === expected);
      await until(page, (s) => s.pixel.grounded);
    }

    expect(picture(await state(page))).toMatchObject({ state: 'fallen', events: 1 });
    expect((await state(page)).chaos.score).toBe(PICTURE_RULES.points);
  });
});
