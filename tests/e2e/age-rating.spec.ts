import { test, expect, waitForLoadingScreen } from './support';

for (const viewport of [
  { width: 1366, height: 900 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
  { width: 1024, height: 768 },
]) {
  test(
    `Altersinformation im Footer und vor Spielbeginn: ${viewport.width}×${viewport.height}`,
    { tag: '@smoke' },
    async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Footer-Einstufung, Sprachwechsel und der sichtbare Ladeeinstieg bleiben als ein zusammenhängender Browserablauf lesbar.
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const landing = page.locator('.landing-footer .age-rating');

      await expect(landing).toContainText('Ab 6 Jahren');
      await expect(landing).toBeVisible();
      await page.getByRole('button', { name: 'English', exact: true }).click();
      await expect(landing).toContainText('Age rating by the provider');
      await expect(landing.locator('.age-number')).toHaveText('6');
      await page.goto('/play.html');
      const loading = page.locator('#loading-screen .age-rating');

      await expect(loading).toContainText('Ages 6');
      await expect(loading).toBeInViewport({ ratio: 1 });
      await waitForLoadingScreen(page);
      const intro = page.locator('main > footer .age-rating');

      await expect(intro).toContainText('Cartoon property damage');
      await intro.scrollIntoViewIfNeeded();
      // Chromium can round the final scroll offset while all text remains readable.
      await expect(intro).toBeInViewport({ ratio: 0.99 });
      const bounds = (await intro.boundingBox())!;

      expect(bounds.x).toBeGreaterThanOrEqual(-0.5);
      expect(bounds.y).toBeGreaterThanOrEqual(-0.5);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 0.5);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 0.5);
      expect(
        await intro.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(12);
      await test.info().attach('altersinformation-einfuehrung', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    },
  );
}
