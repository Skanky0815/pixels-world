import { test, expect, loadIntro, state, until, besideCouch } from './support';
import { startTouch } from './touch-support';

test.use({ hasTouch: true, isMobile: true });

for (const viewport of [
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
]) {
  // eslint-disable-next-line max-lines-per-function -- Sichtbare Geometrie, Schärfe und Touch-Ziele werden zusammen für denselben Viewport geprüft.
  test(`Handheld-Layout ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await startTouch(page);
    const room = await page.locator('#game').boundingBox();
    const left = await page.locator('.touch-directions').boundingBox();
    const right = await page.locator('.touch-actions').boundingBox();

    expect(room && left && right).toBeTruthy();

    if (!room || !left || !right) throw new Error('Layout fehlt');
    const main = await page.locator('main').boundingBox();

    expect(main!.y).toBeGreaterThan(8);
    expect(Math.abs(main!.y - (viewport.height - main!.y - main!.height))).toBeLessThan(2);
    expect(left.x + left.width + 16).toBeLessThanOrEqual(room.x);
    expect(room.x + room.width + 16).toBeLessThanOrEqual(right.x);
    expect(
      Math.max(room.y + room.height, left.y + left.height, right.y + right.height),
    ).toBeLessThanOrEqual(viewport.height);
    const title = await page.locator('header').boundingBox();
    const info = await page.locator('.mobile-hud').boundingBox();

    expect(title!.x + title!.width).toBeLessThanOrEqual(room.x);
    expect(title!.y + title!.height).toBeLessThanOrEqual(left.y);
    expect(info!.x).toBeGreaterThanOrEqual(room.x + room.width);
    expect(info!.y + info!.height).toBeLessThanOrEqual(right.y);
    const canvas = await page.locator('canvas').boundingBox();

    expect(canvas).not.toBeNull();
    expect(canvas!.width / canvas!.height).toBeCloseTo(16 / 9, 1);
    expect(
      await page.locator('canvas').evaluate((node) => getComputedStyle(node).imageRendering),
    ).toBe('pixelated');
    await expect(page.getByRole('region', { name: 'Spielstatus' })).toContainText('CHAOS:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await test.info().attach('handheld', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`Chaosmeldung verschiebt kein Layout ${viewport.width}×${viewport.height} @smoke`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Chaosaktion und Ablauf prüfen dieselbe Geometrie vor, während und nach der Meldung.
  }) => {
    await page.setViewportSize(viewport);
    await startTouch(page);
    await besideCouch(page);
    await until(page, (s) => !s.feedback.text);
    const before = await mobileGeometry(page);

    await until(page, (s) => s.couch.damage === 1);
    await expect(page.locator('.mobile-hud')).toContainText('Kratzen');
    expect(await mobileGeometry(page)).toEqual(before);
    await until(page, (s) => !s.feedback.text);
    expect(await mobileGeometry(page)).toEqual(before);
  });
}

async function mobileGeometry(page: import('@playwright/test').Page) {
  return page
    .locator('.mobile-hud, #game, .touch-directions, .touch-actions')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();

        return { x, y, width, height };
      }),
    );
}

test('Schmales Hochformat: Einführung scrollbar, Start erreichbar und Rotation erhält die Runde', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Einführung, Rotation und Eingabe gehören zu derselben fortgesetzten Runde.
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await loadIntro(page);
  await expect(page.locator('.start-prompt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeVisible();
  expect(
    await page.locator('.start-copy').evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  const touch = await startTouch(page);
  const before = await state(page);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  expect((await state(page)).generation).toBe(before.generation);
  await touch.press('right');
  await page.clock.runFor(200);
  await touch.lift();
  expect((await state(page)).pixel.x).toBeGreaterThan(before.pixel.x);
});
