import { openPause, returnToMenu } from '../support/pause-support';
import { test, expect, until, waitForGame, waitForLoadingScreen } from '../support/support';
import { expectArtwork, expectTeam } from '../support/landing';

test(
  'Landingpage: DE/EN und Tastatur führen ohne Umweg ins Spiel',
  { tag: '@integration' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Tastatur, Sprachpersistenz und tatsächlicher Spielstart bilden den gemeinsamen Einstieg.
  }) => {
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
    await returnToMenu(page);
    await page.getByRole('link', { name: 'Quit game', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('http://127.0.0.1:4174/');
    await expect(page.locator('h1')).toHaveText('One room. One cat. Your chaos.');
    await expect(page.locator('canvas')).toHaveCount(0);
  },
);

test(
  'Landingpage: Pages-Unterpfad lädt nur lokale Ressourcen und erhält die Navigation',
  { tag: '@integration' },
  async ({
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
    await returnToMenu(page);
    await page.getByRole('link', { name: 'Beenden', exact: true }).click();
    await expect(page).toHaveURL(base);
    await expect(page.locator('canvas')).toHaveCount(0);
  },
);

// eslint-disable-next-line max-lines-per-function -- Die Gerätegruppe bindet denselben vollständigen Einstieg an echte Touch-Eingaben.
test.describe('Landingpage mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test(
    'Touch-CTA bleibt auf dem iPhone-Format erreichbar',
    { tag: '@landing-transition' },
    // eslint-disable-next-line max-lines-per-function -- Sprache und echtes Antippen führen im selben überwachten Browser bis zur Spieleinführung.
    async ({ page }) => {
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
    },
  );
});
