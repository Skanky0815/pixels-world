import { test, expect, start, state, until, holdUntil } from './support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 900 } });

test('Desktopkamera: erkunden, Dialog und Minispiel mit Tastatur; klassische Ansicht bleibt erhalten', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Der Desktopversuch verbindet Tastaturbewegung, Fensterwechsel, feste Dialoge, Versöhnung und die unveränderte klassische Ansicht.
}) => {
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  expect((await state(page)).camera.zoom).toBe(1.35);
  await expect(page.locator('.mobile-hud')).toBeVisible();
  const before = (await state(page)).camera.x;

  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x > 475);
  expect((await state(page)).camera.x).toBeGreaterThan(before + 40);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.left <= 0.1);

  for (const width of [1920, 1000, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await until(page, (s) => s.camera.zoom === (width > 1024 ? 1.35 : 1));
    expect((await state(page)).started).toBe(true);
  }

  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    500,
  );

  for (const width of [1100, 1920, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.runFor(100);
    await leftCard(page);
  }

  expect((await state(page)).sara.canvasTextVisible).toBe(false);
  await press(page, 'Space');
  await until(page, (s) => s.reconciliation.stage === 'reading');
  await press(page, 'Space');
  await completeCharm(page);
  await until(page, (s) => s.result !== null);
  await leftCard(page);
  await test.info().attach('Desktopkamera mit Ergebnis', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await start(page, '/?camera=room&round-profile=fast');
  expect((await state(page)).camera).toEqual({ x: 0, y: 0, width: 960, height: 540, zoom: 1 });
  await expect(page.locator('.mobile-hud')).toBeHidden();
});

async function press(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  await page.keyboard.up(key);
}

// eslint-disable-next-line max-lines-per-function -- Reale Pfeiltasten bedienen alle Folgen, während die feste DOM-Vorgabe sichtbar bleibt.
async function completeCharm(page: Page) {
  const initial = (await state(page)).reconciliation;
  const keys = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

  for (let heart = 0; heart < initial.required; heart++) {
    for (let index = 0; index < initial.length; index++) {
      await until(page, (s) => s.reconciliation.stage === 'input', 100);
      const direction = (await state(page)).reconciliation.expected;

      await expect(page.locator('.mobile-key')).toBeInViewport({ ratio: 1 });
      await leftCard(page);

      if (direction) await press(page, keys[direction]);
    }

    if ((await state(page)).reconciliation.stage === 'feedback') await press(page, 'Space');
  }
}

// eslint-disable-next-line max-lines-per-function -- Kameraprojektion und echte DOM-Geometrie sichern die freie Sicht auf die beiden Figuren.
async function leftCard(page: Page) {
  const s = await state(page);
  const card = (await page.locator('.mobile-dialogue').boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;
  const viewLeft = s.camera.x + (s.camera.width - s.camera.width / s.camera.zoom) / 2;
  const actorLeft = Math.min(
    s.pixel.visualX - s.pixel.displayWidth / 2,
    s.sara.x - s.sara.displayHeight / 3,
  );
  const screenLeft =
    canvas.x + ((actorLeft - viewLeft) * s.camera.zoom * canvas.width) / s.camera.width;

  await expect(page.locator('.mobile-hud')).not.toContainText(/Ziel|goal|Normal|Schwer|Leicht/i);
  await expect(page.locator('.mobile-dialogue')).not.toContainText(
    /Versuche|attempts|Schwierigkeitsgrad|Difficulty|Hauptziel|Main goal/i,
  );
  await expect(page.locator('.result-goal, .mobile-goal')).toHaveCount(0);
  expect(card.width).toBeGreaterThan(350);
  expect(card.x - canvas.x).toBeCloseTo(24, 0);
  expect(card.x + card.width + 4).toBeLessThanOrEqual(screenLeft);
  await expect(page.locator('.mobile-dialogue')).toBeInViewport({ ratio: 1 });
  expect(
    await page.locator('.mobile-dialogue').evaluate((n) => n.scrollWidth <= n.clientWidth),
  ).toBe(true);
}
