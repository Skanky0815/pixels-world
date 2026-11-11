import { test, expect, start, until, state, reset } from './support';
import { climbToBall } from './goal-support';
import { startTouch } from './touch-support';
import { expectCharacterView, prepareCharacterView } from './character-visuals';

test(
  'Ballfund: hin und zurück, Drehungen, Pause und Fokus; Heimkehr erst danach',
  { tag: '@smoke' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Der vollständige sichtbare Spielmoment wird mit realem Fund, Browserfokus und Menü geprüft.
  }) => {
    await prepareCharacterView(page);
    await start(page);
    await climbToBall(page);
    await until(page, (s) => s.ballPlay.active);
    const found = await state(page);

    expect(found.homecoming.stage).toBe('waiting');
    expect(found.sara.visible).toBe(true);
    expect(found.sara.portrait.texture).toBe('sara-friendly');
    await until(page, (s) => s.ballPlay.phase === 'tap-right' && s.pixel.visualFrame === 20, 8);
    await expectCharacterView(page, 'pixel-ball.png', { x: 800, y: 62, width: 136, height: 104 });
    await until(page, (s) => s.ballPlay.elapsedMs >= 1600);
    const right = await state(page);

    expect(right.goalView.ballX).toBeGreaterThan(found.goalView.ballX + 40);
    // Phaser normalizes the six-radian roll into [-π, π].
    expect(right.goalView.ballRotation).toBeCloseTo(6 - 2 * Math.PI, 4);
    expect(right.pixel.visualFlipX).toBe(false);
    await page.keyboard.press('Escape');
    const paused = await state(page);

    await page.clock.runFor(1500);
    expect((await state(page)).ballPlay).toEqual(paused.ballPlay);
    expect((await state(page)).pixel).toEqual(paused.pixel);
    expect((await state(page)).goalView).toEqual(paused.goalView);
    await page.getByLabel('Bewegung reduzieren', { exact: true }).check();
    expect((await state(page)).goalView.ballX).toBe(found.goalView.ballX);
    await page.getByLabel('Bewegung reduzieren', { exact: true }).uncheck();
    expect((await state(page)).goalView.ballX).toBe(right.goalView.ballX);
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const unfocused = await state(page);

    await page.clock.runFor(1500);
    expect((await state(page)).ballPlay).toEqual(unfocused.ballPlay);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await until(page, (s) => s.ballPlay.elapsedMs >= 2800);
    const left = await state(page);

    expect(left.goalView.ballX).toBe(found.goalView.ballX);
    expect(left.pixel.visualFlipX).toBe(true);
    expect(left.homecoming.stage).toBe('waiting');
    expect(left.round).toEqual(found.round);
    expect(left.objects).toEqual(found.objects);
    expect(left.chaos).toEqual(found.chaos);
    await until(page, (s) => !s.ballPlay.active);
    const finished = await state(page);

    expect(finished.ballPlay.elapsedMs).toBe(4200);
    expect(finished.homecoming.stage).toBe('entering');
    expect(finished.pixel.x).toBeCloseTo(finished.pixel.visualX, 0);
    await until(
      page,
      (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
      500,
    );
    expect((await state(page)).ballPlay.elapsedMs).toBe(4200);
  },
);

test('Neustart während des Ballspiels entfernt den Ablauf und seine spätere Heimkehr', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Abbruch, neue Szene und Ablauf der alten Dauer werden zusammen geprüft.
}) => {
  await start(page);
  await climbToBall(page);
  await until(page, (s) => s.ballPlay.elapsedMs >= 1000);
  await reset(page);
  await page.clock.runFor(5000);
  const current = await state(page);

  expect(current.ballPlay).toMatchObject({ active: false, elapsedMs: 0 });
  expect(current.homecoming).toMatchObject({ stage: 'waiting', selection: null });
  expect(current.goal.status).toBe('active');
  expect(current.goalView).toMatchObject({ ballX: 850, ballRotation: 0 });
  expect(current.pixel.visualX).toBeCloseTo(current.pixel.x, 0);
});

// eslint-disable-next-line max-lines-per-function -- Beide Bewegungspräferenzen teilen denselben echten Touch-Weg und die Gerätekonfiguration.
test.describe('Ballspiel mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const reduced of [false, true]) {
    test(`Fund und Spielmoment mit ${reduced ? 'reduzierter' : 'normaler'} Bewegung`, async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Der schadenfreie Touch-Weg und die anschließende sichtbare Animation bilden einen echten Nutzerablauf.
    }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });

      if (reduced)
        await page.addInitScript(() => localStorage.setItem('pixels-world.language', 'en'));
      const touch = await startTouch(page);

      await touch.press('right');
      await until(page, (s) => s.pixel.x >= 800);
      await touch.lift();
      await touch.press('up');
      await until(page, (s) => s.pixel.bottom <= 116);
      await touch.lift();
      await touch.press('right');
      await until(page, (s) => s.pixel.x >= 835);
      await touch.lift();
      await touch.press('down');
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2);
      await touch.lift();
      await until(page, (s) => s.ballPlay.active);
      const found = await state(page);

      await until(page, (s) => s.ballPlay.elapsedMs >= 1600);
      const playing = await state(page);

      expect(playing.chaos.score).toBe(0);
      await expect(page.locator('.mobile-portrait')).toHaveAttribute(
        'data-portrait',
        'sara-friendly',
      );
      await expect(page.locator('.mobile-quote')).not.toBeEmpty();
      await expect(page.locator('.mobile-dialogue')).toHaveAttribute('data-placement', 'welcome');
      expect(
        await page
          .locator('.mobile-dialogue')
          .evaluate(
            (panel) =>
              panel.getBoundingClientRect().top - panel.parentElement!.getBoundingClientRect().top,
          ),
      ).toBeGreaterThan(60);
      expect(playing.homecoming.stage).toBe('waiting');
      expect(playing.goalView.ballX).toBe(reduced ? found.goalView.ballX : 898);

      if (reduced) expect(playing.pixel.visualX).toBe(found.pixel.visualX);
      await test
        .info()
        .attach('ballspiel-touch', { body: await page.screenshot(), contentType: 'image/png' });
      await until(page, (s) => !s.ballPlay.active);
      expect((await state(page)).homecoming.stage).toBe('entering');
      await until(
        page,
        (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
        500,
      );
      await touch.tap('jump');
      await until(page, (s) => s.result !== null);
      const ended = await state(page);

      expect(ended.reconciliation.stage).toBe('waiting');
      expect(ended.result?.peaceful).toBe(true);
      await expect(page.locator('.mobile-result .result-hearts')).toBeHidden();
      await expect(page.locator('.result-headline')).toHaveText(
        reduced ? 'Just a lovely day!' : 'Einfach ein schöner Tag!',
      );
      await test.info().attach('peaceful-touch-result', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  }
});
