import { test, expect, loadIntro, state, until, waitForGame } from '../support/support';
import { TouchDriver } from '../support/touch-support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from '../support/round-clock';
import type { Page } from '@playwright/test';
import { observe, until as untilRoom } from './kitchen-support';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 568, height: 320 } });

test('Kameradialog links: Figuren, lange Texte und Touch-Eingaben bleiben sichtbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dialog, echte Touch-Versöhnung und Ergebnis behalten dieselbe freie Sicht auf beide Figuren.
}) => {
  await seedRoundRandom(page);
  await loadIntro(page, '/?round-profile=fast');
  const touch = await TouchDriver.create(page);

  await touch.tap('jump');
  await until(page, (s) => s.started && s.pixel.grounded);
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    500,
  );

  for (const viewport of [
    { width: 844, height: 330 },
    { width: 932, height: 236 },
    { width: 568, height: 236 },
    { width: 568, height: 320 },
  ]) {
    await page.setViewportSize(viewport);
    const content = (await page.locator('#game-content').boundingBox())!;

    await until(
      page,
      (s) => Math.abs(s.camera.width / s.camera.height - content.width / content.height) < 0.01,
    );
    const resized = await state(page);

    await until(page, (snapshot) => snapshot.frame > resized.frame, 100);
    await clearDialogue(page);
    await page.screenshot({
      path: `test-results/camera-dialogue-${viewport.width}x${viewport.height}.png`,
    });
    await test.info().attach(`Dialog ${viewport.width}×${viewport.height}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }

  await page.locator('.mobile-dialogue .mobile-hint').scrollIntoViewIfNeeded();
  await expect(page.locator('.mobile-dialogue .mobile-hint')).toBeInViewport({ ratio: 1 });
  await touch.tap('jump');
  await until(page, (s) => s.reconciliation.stage === 'reading', 100);
  await touch.tap('jump');
  await finishCharm(page, touch);
  await until(page, (s) => s.result !== null);
  await clearDialogue(page);
  await expect(page.locator('.result-headline')).toHaveText('Wieder vertragen!');
  await test
    .info()
    .attach('Linkes Ergebnis', { body: await page.screenshot(), contentType: 'image/png' });
});

// eslint-disable-next-line max-lines-per-function -- Der bestehende Pfeilablauf wird ausschließlich über echte Touch-Ereignisse bedient und auf sichtbare Vorgaben geprüft.
async function finishCharm(page: Page, touch: TouchDriver) {
  const initial = (await state(page)).reconciliation;

  for (let heart = 0; heart < initial.required; heart++) {
    for (let index = 0; index < initial.length; index++) {
      await until(page, (s) => s.reconciliation.stage === 'input', 100);
      const direction = (await state(page)).reconciliation.expected;

      await expect(page.locator('.mobile-key')).toBeInViewport({ ratio: 1 });
      await clearDialogue(page);

      if (direction) await touch.tap(direction);
      await page.clock.runFor(100);
    }

    if ((await state(page)).reconciliation.stage === 'feedback') await touch.tap('jump');
  }
}

// eslint-disable-next-line max-lines-per-function -- DOM-Karte und skalare Figurenanker teilen dieselbe Kameraprojektion; keine Engine-Referenzen oder Zustandsänderungen.
async function clearDialogue(page: Page) {
  const s = await observe(page);
  const rightSide =
    (await page.locator('.mobile-dialogue').getAttribute('data-dialogue-side')) === 'right';
  const panel = (await page.locator('.mobile-dialogue').boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;
  const controls = (await page.locator('.touch-directions').boundingBox())!;
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

  if (rightSide) expect(canvas.x + canvas.width - panel.x - panel.width).toBeCloseTo(8, 0);
  else expect(panel.x - canvas.x).toBeCloseTo(8, 0);

  if (page.viewportSize()!.height <= 380) {
    const actions = (await page.locator('.touch-actions').boundingBox())!;
    const actorRight = Math.max(
      s.pixel.visualX + s.pixel.displayWidth / 2,
      s.sara.x + s.sara.displayHeight / 3,
    );
    const screenRight =
      canvas.x + ((actorRight - viewLeft) * s.camera.zoom * canvas.width) / s.camera.width;

    if (rightSide) {
      expect(
        Math.max(controls.x + controls.width, actions.x + actions.width) + 4,
      ).toBeLessThanOrEqual(screenLeft);
      expect(
        Math.max(controls.x + controls.width, actions.x + actions.width) + 7,
      ).toBeLessThanOrEqual(panel.x);
    } else {
      expect(screenRight + 4).toBeLessThanOrEqual(Math.min(controls.x, actions.x));
      expect(panel.x + panel.width + 7).toBeLessThanOrEqual(controls.x);
    }

    expect(controls.y).toBeGreaterThanOrEqual(canvas.y);
    expect(controls.y + controls.height).toBeLessThanOrEqual(canvas.y + canvas.height);
    expect(
      (await page.locator('[data-control="left"]').boundingBox())!.height,
    ).toBeGreaterThanOrEqual(48);
  } else expect(panel.y + panel.height + 7).toBeLessThanOrEqual(controls.y);

  if (rightSide) {
    const actorRight = Math.max(
      s.pixel.visualX + s.pixel.displayWidth / 2,
      s.sara.x + s.sara.displayHeight / 3,
    );

    expect(
      canvas.x + ((actorRight - viewLeft) * s.camera.zoom * canvas.width) / s.camera.width + 4,
    ).toBeLessThanOrEqual(panel.x);
  } else expect(panel.x + panel.width + 4).toBeLessThanOrEqual(screenLeft);
  expect(
    await page.locator('.mobile-dialogue').evaluate((n) => n.scrollWidth <= n.clientWidth),
  ).toBe(true);
  await expect(page.locator('.mobile-dialogue')).toBeInViewport({ ratio: 1 });
}

test('Kameradialog rechts: kompakte Touchflächen spiegeln sich im Schlafzimmer', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Rechter Raumanker wird über echte Schlafzimmerwahl und vollständige Heimkehr geprüft.
}) => {
  await seedRoundRandom(page);
  await page.goto('/play.html?round-profile=fast');
  await waitForGame(page, false);
  await page.locator('[data-menu-play]').click();
  await page.locator('[data-room-choice="bedroom"]').click();
  await page.locator('[data-room-start]').click();
  await untilRoom(page, (snapshot) => snapshot.room.id === 'bedroom' && snapshot.intro.visible);
  const touch = await TouchDriver.create(page);

  await touch.tap('jump');
  await untilRoom(page, (snapshot) => snapshot.started && snapshot.pixel.grounded);
  await useIdleFrames(page);
  await page.clock.runFor((await observe(page)).round.returnAtMs + 1000);
  await untilRoom(
    page,
    (snapshot) =>
      snapshot.homecoming.stage === 'dialogue' && snapshot.pixelReturn.stage === 'seated',
  );

  for (const viewport of [
    { width: 932, height: 236 },
    { width: 568, height: 236 },
  ]) {
    await page.setViewportSize(viewport);
    const content = (await page.locator('#game-content').boundingBox())!;

    await untilRoom(
      page,
      (snapshot) =>
        Math.abs(snapshot.camera.width / snapshot.camera.height - content.width / content.height) <
        0.01,
    );
    const resized = await observe(page);

    await untilRoom(page, (snapshot) => snapshot.frame > resized.frame);
    await clearDialogue(page);
    await page.screenshot({
      path: `test-results/camera-dialogue-right-${viewport.width}x${viewport.height}.png`,
    });
  }
});
