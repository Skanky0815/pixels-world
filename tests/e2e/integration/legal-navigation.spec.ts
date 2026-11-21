import { test, expect, loadIntro, start } from '../support/support';

test(
  'Rechtsseiten öffnen aus Einführung und Spiel im selben Tab',
  { tag: '@integration' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Navigation aus beiden Spielzuständen, derselbe Tab und funktionsfähige Rücklinks werden gemeinsam geprüft.
  }) => {
    for (const playing of [false, true]) {
      for (const [title, path] of [
        ['Impressum', 'impressum.html'],
        ['Datenschutz', 'datenschutz.html'],
      ]) {
        if (playing) await start(page);
        else await loadIntro(page);
        const pages = page.context().pages().length;

        await page.locator('.pause-toggle').click();
        await page.locator('[data-menu-information]').click();
        await page
          .locator('[data-game-information]')
          .getByRole('link', { name: title, exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`/${path}$`));
        expect(page.context().pages()).toHaveLength(pages);
        await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'rico-schulz@web.de', exact: true }),
        ).toHaveAttribute('href', 'mailto:rico-schulz@web.de');
        await expect(page.locator('canvas, script')).toHaveCount(0);
        await expect(page.locator('a[href$="play.html"]')).toHaveCount(0);
        await page.getByRole('link', { name: 'Pixel’s World', exact: true }).click();
        await expect(page).toHaveURL('http://127.0.0.1:4174/');
        await expect(page.locator('h1')).toHaveText('Ein Zimmer. Eine Katze. Dein Chaos.');
        await expect(page.locator('canvas')).toHaveCount(0);
      }
    }
  },
);
