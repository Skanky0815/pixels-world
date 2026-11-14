import { openPause } from './pause-support';
import { test, expect, until, waitForGame, waitForLoadingScreen } from './support';

for (const width of [320, 390, 768, 1440]) {
  // eslint-disable-next-line max-lines-per-function -- Derselbe sichtbare Landingpage-Vertrag wird pro Bildschirmbreite vollständig geprüft.
  test(`Landingpage: lesbarer Einstieg ohne Spielengine bei ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
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

// eslint-disable-next-line max-lines-per-function -- Tastatur, Sprachpersistenz und echtes Starten prüfen den vollständigen neuen Einstiegsweg.
test('Landingpage: DE/EN und Tastatur führen ohne Umweg ins Spiel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.ai-disclosure')).toContainText('created with AI');
  await expect(page.locator('.landing-album')).toContainText(
    'Anything you haven’t discovered stays a secret.',
  );
  await expect(page.getByRole('heading', { name: 'The minds behind the mess.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meet the team', exact: true })).toHaveAttribute(
    'href',
    './#team',
  );
  await expect(page.locator('article', { has: page.locator('#team-sara') })).toContainText(
    'AI contributor',
  );
  await expect(
    page.getByRole('img', { name: 'Pixel-art portrait of Rico with glasses and ash-blond hair' }),
  ).toBeVisible();
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
  await openPause(page);
  await page.getByRole('link', { name: 'Quit game', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('http://127.0.0.1:4174/');
  await expect(page.locator('h1')).toHaveText('One room. One cat. Your chaos.');
  await expect(page.locator('canvas')).toHaveCount(0);
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
  await expectTeam(page, 1280);
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
  await waitForLoadingScreen(page);
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-settings]').click();
  await page.getByRole('link', { name: 'Beenden', exact: true }).click();
  await expect(page).toHaveURL(base);
  await expect(page.locator('canvas')).toHaveCount(0);
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

// eslint-disable-next-line max-lines-per-function -- Inhalt, semantische Reihenfolge und responsiver Profilaufbau bilden denselben Landingpage-Vertrag.
async function expectTeam(page: import('@playwright/test').Page, width: number) {
  const team = page.getByRole('region', { name: 'Die Köpfe hinter dem Chaos.' });

  await expect(team).toBeVisible();
  await expect(team.locator('article')).toHaveCount(3);
  await expect(team.locator('h3')).toHaveText(['Rico', 'Sara', 'Pixel']);
  await expect(page.locator('.landing-header nav a')).toHaveText([
    'Das Spiel',
    'Über uns',
    'Emojis',
    'Hilfe',
    'GitHub ↗',
  ]);
  await expect(team.locator('article', { has: page.locator('#team-sara') })).toContainText(
    'KI-Mitwirkende',
  );
  await expect(team.getByRole('img', { name: /Pixel-Art-Porträt von Rico/ })).toBeVisible();
  await expect(team.getByRole('link', { name: 'Rico auf GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Skanky0815',
  );
  await expect(team.getByRole('link', { name: 'Sara auf GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Sara-Pixel42',
  );
  const positions = await team.locator('article').evaluateAll((nodes) =>
    nodes.map((node) => {
      const portrait = node.querySelector('.team-portrait')!.getBoundingClientRect();
      const identity = node.querySelector('.team-identity')!.getBoundingClientRect();

      return {
        beside: identity.left >= portrait.right,
        aligned: Math.abs(identity.top - portrait.top) < 1,
      };
    }),
  );

  expect(positions.every((p) => p.beside && p.aligned)).toBe(true);

  const boxes = await team.locator('article').evaluateAll((nodes) =>
    nodes.map((node) => {
      const b = node.getBoundingClientRect();

      return { x: b.x, y: b.y, width: b.width };
    }),
  );

  expect(boxes.every((b) => b.x >= 0 && b.x + b.width <= width)).toBe(true);
  expect(width <= 1000 ? boxes[1].y > boxes[0].y : boxes[1].x > boxes[0].x).toBe(true);
  expect(
    await page
      .locator('.landing-team')
      .evaluate(
        (node) =>
          !!(
            node.compareDocumentPosition(document.querySelector('footer')!) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
  expect(
    await page
      .locator('.landing-finale')
      .evaluate(
        (node) =>
          !!(
            node.compareDocumentPosition(document.querySelector('.landing-team')!) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
}
