import { test, expect, waitForLoadingScreen } from './support';

for (const viewport of [
  { width: 1366, height: 900 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
  { width: 1024, height: 768 },
]) {
  test(`Altersinformation ohne Scrollen: ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const landing = page.locator('main > .age-rating');

    await expect(landing).toContainText('Ab 6 Jahren');
    await expect(landing).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(landing).toContainText('Age rating by the provider');
    await page.goto('/play.html');
    const loading = page.locator('#loading-screen .age-rating');

    await expect(loading).toContainText('Ages 6+');
    await expect(loading).toBeInViewport({ ratio: 1 });
    await waitForLoadingScreen(page);
    const intro = page.locator('.start-screen .age-rating');

    await expect(intro).toContainText('Cartoon damage');
    await expect(intro).toBeInViewport({ ratio: 1 });
    expect(
      await intro.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14);
    await test.info().attach('altersinformation-einfuehrung', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
}
