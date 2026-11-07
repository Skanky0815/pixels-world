import { test, expect, until, waitForGame } from './support';

for (const width of [320, 390, 768, 1440]) {
  // eslint-disable-next-line max-lines-per-function -- Derselbe sichtbare Landingpage-Vertrag wird pro Bildschirmbreite vollständig geprüft.
  test(`Landingpage: lesbarer Einstieg ohne Spielengine bei ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Ein Zimmer. Eine Katze. Dein Chaos.',
    );
    await expect(page.locator('canvas, .start-screen, .pause-menu')).toHaveCount(0);
    await expect(page.locator('.play-link')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expectArtwork(page);
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

// eslint-disable-next-line max-lines-per-function -- Tastatur, Sprachpersistenz und echtes Starten prüfen den vollständigen neuen Einstiegsweg.
test('Landingpage: DE/EN und Tastatur führen ohne Umweg ins Spiel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'One room. One cat. Your chaos.',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const link = page.getByRole('link', { name: 'Play now →' }).first();

  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/play.html$/);
  await waitForGame(page);
  await expect(page.locator('.start-screen')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#game').focus();
  await page.keyboard.down('Space');
  await until(page, (s) => s.started);
  await page.keyboard.up('Space');
});

test('Landingpage: Pages-Unterpfad lädt nur lokale Ressourcen und erhält die Navigation', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Der veröffentlichte Unterpfad prüft Ressourcen und echte Navigation zusammen.
}) => {
  const scripts: string[] = [];
  const external: string[] = [];

  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());

    if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  const base = 'http://127.0.0.1:4175/pixels-world/';

  await page.goto(base);
  await expectArtwork(page);
  expect(scripts.some((url) => /\/game-/.test(url))).toBe(false);
  expect(external).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(0);

  for (const [name, path] of [
    ['Impressum', 'impressum.html'],
    ['Datenschutz', 'datenschutz.html'],
  ]) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(base + path);
    await expect(page.locator('canvas, script')).toHaveCount(0);
    await page.goBack();
  }

  await page.getByRole('link', { name: 'Jetzt spielen →' }).last().click();
  await expect(page).toHaveURL(base + 'play.html');
  await expect
    .poll(async () => {
      await page.clock.runFor(32);

      return page.locator('.start-screen:visible').count();
    })
    .toBe(1);
});

// eslint-disable-next-line max-lines-per-function -- Die Gerätegruppe bindet denselben vollständigen Einstieg an echte Touch-Eingaben.
test.describe('Landingpage mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  // eslint-disable-next-line max-lines-per-function -- Sprache und echtes Antippen führen im selben überwachten Browser bis zur Spieleinführung.
  test('Touch-CTA bleibt auf dem iPhone-Format erreichbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'English', exact: true }).tap();
    await expect(page.locator('h1')).toHaveText('One room. One cat. Your chaos.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('link', { name: 'Play now →' }).first().tap();
    await expect(page).toHaveURL(/\/play.html$/);
    await waitForGame(page);
    await expect(page.locator('.start-screen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });
});

async function expectArtwork(page: import('@playwright/test').Page) {
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
  }
}
