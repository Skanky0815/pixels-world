import { test, expect } from '../support/support';
import { expectArtwork, expectTeam } from '../support/landing';

for (const width of [320, 390, 768, 1440]) {
  // eslint-disable-next-line max-lines-per-function -- Derselbe sichtbare Landingpage-Vertrag wird pro Bildschirmbreite vollständig geprüft.
  test(`Landingpage: lesbarer Einstieg ohne Spielengine bei ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const gameModules: string[] = [];

    page.on('request', (request) => {
      if (/\/(?:world-[^/]+\.js|game\/play\/)/.test(request.url())) gameModules.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Ein Zimmer. Eine Katze. Dein Chaos.',
    );
    await expect(page.locator('canvas, .start-screen, .pause-menu')).toHaveCount(0);
    await expect(page.locator('.play-link')).toHaveCount(4);
    await expect(page.locator('.landing-achievements')).toContainText('Pixels Meisterwerk');
    await expect(page.locator('.landing-achievements img')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.landing-album')).toContainText(
      'Was noch unentdeckt ist, bleibt ein Geheimnis.',
    );
    await expect(page.locator('.landing-album .play-link')).toHaveAttribute('href', './play.html');
    expect(gameModules).toEqual([]);
    await expectArtwork(page);
    await expectTeam(page, width);
    await page.getByRole('link', { name: 'Über uns', exact: true }).click();
    await expect(page).toHaveURL(/#team$/);
    await page.getByRole('link', { name: 'Emojis', exact: true }).click();
    await expect(page).toHaveURL(/#emojis$/);
    await expect(page.locator('.landing-emojis')).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Impressum', exact: true })).toHaveAttribute(
      'href',
      './impressum.html',
    );
    await expect(page.getByRole('link', { name: 'Datenschutz', exact: true })).toHaveAttribute(
      'href',
      './datenschutz.html',
    );
    await test.info().attach(`landing-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}
