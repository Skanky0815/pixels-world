import { test, expect, loadIntro, state } from './support';
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
    expect(left.x + left.width).toBeLessThanOrEqual(room.x);
    expect(room.x + room.width).toBeLessThanOrEqual(right.x);
    expect(
      Math.max(room.y + room.height, left.y + left.height, right.y + right.height),
    ).toBeLessThanOrEqual(viewport.height);
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

test('Schmales Hochformat: Einführung scrollbar, Start erreichbar und Rotation erhält die Runde', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Einführung, Rotation und Eingabe gehören zu derselben fortgesetzten Runde.
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await loadIntro(page);
  await expect(page.locator('.start-prompt')).toBeVisible();
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
