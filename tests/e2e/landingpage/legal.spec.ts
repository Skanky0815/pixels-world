import { test, expect } from '../support/support';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { version: string };

test('Rechtsseiten sind im Root- und Pages-Unterpfad lesbar und ohne Spielcode direkt erreichbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
}) => {
  for (const base of ['http://127.0.0.1:4174', 'http://127.0.0.1:4175/pixels-world']) {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(`${base}/impressum.html`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
    await expect(page.locator('#build-info')).toContainText(`Pixel's World · v${version}`);
    await expect(page.locator('.ai-disclosure')).toContainText('mit KI erstellt');
    await expect(page.locator('address')).toContainText('Rico Schulz');
    await expect(page.locator('address')).toContainText('Berlin');
    await expect(page.locator('#audio-credits')).toContainText('alexarje');
    await expect(page.locator('#audio-credits')).toContainText('Bearbeitet');
    await expect(
      page.locator('#audio-credits a[href="https://creativecommons.org/licenses/by/4.0/"]'),
    ).toHaveText('CC BY 4.0');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await test.info().attach('impressum-schmal', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.getByRole('link', { name: 'Datenschutz', exact: true }).click();
    await expect(page).toHaveURL(`${base}/datenschutz.html`);
    await expect(page.getByRole('heading', { name: 'Hosting über GitHub Pages' })).toBeVisible();
    await expect(page.locator('canvas, script')).toHaveCount(0);
    await expect(page.locator('#build-info')).toContainText(`Pixel's World · v${version}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page
        .getByRole('link', { name: 'Das Spiel', exact: true })
        .evaluate((link) => (link as HTMLAnchorElement).href),
    ).toBe(`${base}/#spielidee`);
    await test.info().attach('datenschutz-schmal', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});
