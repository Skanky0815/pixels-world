/* eslint-disable max-lines-per-function -- Landing-Einstieg, Tastatur, Übersetzung und Rückweg bilden denselben Hilfe-Besuch ohne Spielstart. */
import { test, expect } from '@playwright/test';

for (const [width, height, base] of [
  [320, 740, 'http://127.0.0.1:4174/'],
  [568, 320, 'http://127.0.0.1:4175/pixels-world/'],
  [1440, 900, 'http://127.0.0.1:4175/pixels-world/'],
] as const) {
  test(`Hilfe ${width}×${height}: auffindbar, DE/EN, Tastatur und sichere Update-Links @smoke`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    const scripts: string[] = [];

    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url());
    });
    await page.goto(base);
    await expect(page.locator('.landing-header .help-link')).toBeVisible();
    await expect(page.locator('.landing-footer a[href="./help.html"]')).toBeVisible();
    const header = await page.locator('.landing-header').innerHTML();
    const footer = await page.locator('.landing-footer').innerHTML();
    const teaser = page.locator('.landing-help');

    await teaser.scrollIntoViewIfNeeded();
    await expect(teaser).toContainText('Fragen vor der nächsten Chaosrunde?');
    const pixel = teaser.getByRole('img', { name: /Pixel legt den Kopf/ });

    await expect
      .poll(() => pixel.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBe(128);
    await teaser
      .screenshot()
      .then((body) => testInfo.attach('faq-teaser', { body, contentType: 'image/png' }));
    await teaser.getByRole('link', { name: 'Zur Hilfe →' }).click();
    await expect(page).toHaveURL(base + 'help.html');
    expect(await page.locator('.landing-header').innerHTML()).toBe(header);
    expect(await page.locator('.landing-footer').innerHTML()).toBe(footer);
    await expect(page.locator('.landing-header nav a')).toHaveText([
      'Das Spiel',
      'Über uns',
      'Emojis',
      'Hilfe',
      'GitHub ↗',
    ]);
    await expect(page.locator('.help-content > a')).toHaveCount(0);
    await expect(page.locator('#updates [data-recover-game]')).toHaveCount(1);
    await expect(page.locator('a[href="./update.html"]')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveText('Hilfe für kleine Chaospausen');
    const first = page.locator('summary').first();

    await first.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('details').first()).not.toHaveAttribute('open');

    for (const summary of await page.locator('summary').all()) {
      await summary.focus();
      await page.keyboard.press('Enter');
    }

    await expect(page.locator('details[open]')).toHaveCount(6);
    await expect(page.locator('#updates')).toContainText('Jeder offene Spiel-Tab');
    await expect(page.locator('#album')).toContainText('nur für diesen Besuch');
    await expect(page.locator('#website-data')).toContainText('nicht als normalen Update-Schritt');
    await expect(page.locator('#offline')).toContainText('allein lädt keine Offline-Kopie');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(page.locator('summary')).toHaveText([
      'How do I update the game?',
      'Why do I see an old version?',
      'Where is my album saved?',
      'What happens if I delete website data?',
      'Can I play offline?',
      'How do I install the game on my phone?',
    ]);
    await expect(page.locator('#updates h3')).toHaveText([
      'On a computer',
      'Android · Chrome',
      'iPhone · Safari',
      'As an installed app',
    ]);
    await expect(page.locator('#album')).toContainText('no account, cloud sync');
    await expect(page.locator('#website-data')).toContainText('we cannot restore');
    await expect(page.locator('#offline')).toContainText('not your album');
    await expect(page.locator('#install')).toContainText('Open as Web App');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('h1').scrollIntoViewIfNeeded();
    await page
      .screenshot({ fullPage: true })
      .then((body) => testInfo.attach('help-english', { body, contentType: 'image/png' }));
    await expect(page.getByRole('button', { name: 'Open the current version →' })).toBeVisible();
    await expect(page.locator('[data-recovery-status]')).toHaveText(
      'You need an internet connection to update.',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('link', { name: 'Pixel’s World', exact: true }).click();
    await expect(page.locator('.landing-help')).toContainText('Questions before the next round');
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(scripts.some((url) => /\/game-/.test(url))).toBe(false);
  });
}
