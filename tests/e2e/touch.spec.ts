import { test, expect, state, until } from './support';
import { startTouch } from './touch-support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

test(
  'Touch: Start sowie Bewegung und Sprung mit zwei Fingern',
  { tag: '@smoke' },
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängender Nutzerablauf mit echten Touch-Ereignissen und vollständiger Zustandsprüfung.
  async ({ page }) => {
    const touch = await startTouch(page);
    const controls = page.getByRole('navigation', { name: 'Touch-Steuerung' });

    await expect(controls).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sprung', exact: true })).toBeVisible();
    const before = (await state(page)).pixel.x;

    await touch.press('right', 1);
    await until(page, (s) => s.pixel.x > before + 35);
    await touch.press('jump', 2);
    await until(page, (s) => !s.pixel.grounded && s.pixel.velocityY < 0);
    await touch.lift(2);
    await expect(page.locator('[data-control="right"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-control="jump"]')).toHaveAttribute('aria-pressed', 'false');
    await touch.lift(1);
    await until(page, (s) => s.pixel.velocityX === 0);
    expect((await state(page)).started).toBe(true);
  },
);

// eslint-disable-next-line max-lines-per-function -- Verlassen, Browserabbruch und Fokuswechsel werden mit derselben laufenden Runde auf klemmende Eingaben geprüft.
test('Touch: Verlassen, pointercancel und Fokusverlust lösen Richtungen', async ({ page }) => {
  const touch = await startTouch(page);

  await touch.press('right');
  await until(page, (s) => s.pixel.x > 140);
  await touch.move(1, 2, 2);
  await until(page, (s) => s.pixel.velocityX === 0);
  await touch.cancel();
  await touch.press('left');
  await page.clock.runFor(100);
  await touch.cancel();
  await until(page, (s) => s.pixel.velocityX === 0);
  await touch.press('right');
  await page.clock.runFor(100);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await until(page, (s) => s.pixel.velocityX === 0);
  await expect(page.locator('[data-control="right"]')).toHaveAttribute('aria-pressed', 'false');
  await touch.cancel();
});

// eslint-disable-next-line max-lines-per-function -- Tastatur und Touch bleiben gleichzeitig verfügbar; Gegeneingaben neutralisieren sich ohne doppelte Bewegungsaufrufe.
test('Touch und Tastatur: entgegengesetzte Richtungen sind neutral', async ({ page }) => {
  const touch = await startTouch(page);

  await page.keyboard.down('ArrowRight');
  await touch.press('left');
  await page.clock.runFor(150);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await touch.lift();
  await until(page, (s) => s.pixel.velocityX > 0);
  await page.keyboard.up('ArrowRight');
  await until(page, (s) => s.pixel.velocityX === 0);
  await page.getByRole('button', { name: 'Sprung' }).focus();
  await page.keyboard.down('Enter');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Enter');
  await until(page, (s) => s.pixel.grounded);
});

test('Touch: Während der Runde gibt es keinen Neustart-Button', async ({ page }) => {
  await startTouch(page);
  await expect(page.getByRole('button', { name: 'Neue Runde' })).toHaveCount(0);
  await expect(page.locator('[data-control="reset"]')).toBeHidden();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-control="reset"]')).toBeHidden();
});

// eslint-disable-next-line max-lines-per-function -- Der komplette Vorhangweg nutzt ausschließlich echte Touch-Eingaben und dieselben Physikregeln wie die Tastatur.
test('Touch: Vorhang greifen, steigen, rutschen, absteigen und abspringen', async ({ page }) => {
  const touch = await startTouch(page);

  await touch.press('right', 1);
  await until(page, (s) => s.pixel.x >= 790);
  await touch.press('up', 2);
  await until(page, (s) => s.pixel.climbing);
  await touch.lift(1);
  await until(page, (s) => s.pixel.y < 350);
  await touch.lift(2);
  await until(page, (s) => s.curtain.state === 'sliding');
  const sliding = (await state(page)).pixel.y;

  await touch.press('down');
  await until(page, (s) => s.pixel.y > sliding + 25);
  await touch.lift();
  await touch.press('jump');
  await until(page, (s) => !s.pixel.climbing && s.pixel.gravity && s.pixel.velocityY < 0);
  await touch.lift();
});

test('Touch: Rotation löst Finger, behält die Runde und alle Ziele passen in die Breite', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängender Nutzerablauf mit echten Touch-Ereignissen und vollständiger Zustandsprüfung.
}) => {
  const touch = await startTouch(page);
  const before = await state(page);

  await touch.press('right');
  await page.clock.runFor(100);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  expect((await state(page)).generation).toBe(before.generation);
  await expect(page.locator('[data-control="right"]')).toHaveAttribute('aria-pressed', 'false');
  await touch.cancel();
  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page.locator('[data-control]').evaluateAll((buttons) =>
    buttons.map((button) => ({
      hidden: (button as HTMLButtonElement).hidden,
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    })),
  );

  expect(dimensions.every((rect) => rect.hidden || (rect.width >= 48 && rect.height >= 48))).toBe(
    true,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await test.info().attach('mobile-steuerung', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

test('Touch: Knabbern und Kratzen starten automatisch und lassen sich unterbrechen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Beide automatischen Bodenaktionen werden mit echten Touch-Wegen begonnen und mit Bewegung beziehungsweise Sprung unterbrochen.
}) => {
  const touch = await startTouch(page);

  await touch.press('left');
  await until(page, (s) => s.pixel.x <= 103);
  await touch.lift();
  await until(page, (s) => s.plant.state === 'nibbling');
  await touch.press('right');
  await until(page, (s) => s.pixel.x >= 185);
  await touch.lift();
  expect((await state(page)).plant.state).toBe('idle');
  await until(page, (s) => s.couch.damage === 1);
  await touch.press('jump');
  await until(page, (s) => !s.pixel.grounded && s.couch.state === 'idle');
  await touch.lift();
});

const full = process.env.E2E_FULL_ROUND === '1';

test(
  'Touch: Heimkehr, Dialog und erfolgreiche Charmeoffensive ohne Tastatur',
  { tag: full ? '@slow' : '@fast' },
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängender Nutzerablauf mit echten Touch-Ereignissen und vollständiger Zustandsprüfung.
  async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await seedRoundRandom(page);
    const touch = await startTouch(page, full ? '/' : '/?round-profile=fast');

    await useIdleFrames(page);
    await advanceRoundTo(page, (await state(page)).round.returnAtMs);
    await until(
      page,
      (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
      500,
    );
    expect((await state(page)).sara.canvasTextVisible).toBe(false);
    await touch.tap('jump');
    await until(page, (s) => s.reconciliation.stage === 'reading', 100);
    expect((await state(page)).charmDisplay.canvasTextVisible).toBe(false);
    await expect(page.locator('.mobile-dialogue')).toBeVisible();
    await expect(page.locator('.mobile-dialogue')).toContainText('PIXELS CHARME-OFFENSIVE');
    await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeVisible();
    const initial = (await state(page)).reconciliation;

    await touch.tap('jump');

    for (let heart = 0; heart < initial.required; heart++) {
      for (let index = 0; index < initial.length; index++) {
        await until(page, (s) => s.reconciliation.stage === 'input', 100);
        const direction = (await state(page)).reconciliation.expected;

        expect(direction).not.toBeNull();
        await expect(page.locator('.mobile-dialogue progress')).toBeVisible();
        await expect(page.locator('.mobile-key')).not.toBeEmpty();

        if (direction) await touch.tap(direction);
        await page.clock.runFor(100);
      }

      if ((await state(page)).reconciliation.stage === 'feedback') await touch.tap('jump');
    }

    await until(page, (s) => s.reconciliation.stage === 'complete', 100);
    expect((await state(page)).reconciliation.failures).toBe(0);
    expect((await state(page)).result?.outcome).toBe('success');
    await expect(page.locator('.mobile-dialogue')).toContainText('RUNDENERGEBNIS');
    await expect(page.getByRole('button', { name: 'Neue Runde' })).toBeVisible();
    await test.info().attach('mobiles-ergebnis', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    expect((await state(page)).result!.canvasTextVisible).toBe(false);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.clock.runFor(100);
    await expect(page.locator('.mobile-dialogue')).toBeHidden();
    await until(page, (s) => s.result!.canvasTextVisible, 100);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.clock.runFor(100);
    await until(page, (s) => !s.result!.canvasTextVisible, 100);
    const beforeReset = await state(page);

    await touch.tap('reset');
    await until(page, (s) => s.generation === beforeReset.generation + 1);
    await expect(page.locator('[data-control="reset"]')).toBeHidden();
    await expect(page.locator('.touch-controls')).toHaveCount(1);
    await expect(page.locator('.mobile-hud')).toHaveCount(1);
    await expect(page.locator('.mobile-dialogue')).toHaveCount(1);
    expect((await state(page)).chaos.score).toBe(0);
  },
);
