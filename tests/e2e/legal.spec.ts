import { test, expect, loadIntro, start } from './support';

test('Rechtsseiten öffnen aus Einführung und Spiel im selben Tab', async ({
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

      await page.getByRole('link', { name: title, exact: true }).click();
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
});

test('Rechtsseiten sind im Root- und Pages-Unterpfad lesbar und ohne Spielcode direkt erreichbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
}) => {
  for (const base of ['http://127.0.0.1:4174', 'http://127.0.0.1:4175/pixels-world']) {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(`${base}/impressum.html`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
    await expect(page.locator('address')).toContainText('Rico Schulz');
    await expect(page.locator('address')).toContainText('Berlin');
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

test('Produktionsspiel lädt nur eigene Ressourcen und speichert keine Spielstände', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
}) => {
  const external: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') external.push(url.origin);
  });
  await page.goto('http://127.0.0.1:4175/pixels-world/play.html');
  await page.clock.runFor(1000);
  await expect(page.locator('.start-screen')).toBeVisible();
  await page.locator('#game').focus();
  await page.keyboard.down('Space');
  await page.clock.runFor(200);
  await page.keyboard.up('Space');
  await page.clock.runFor(3000);
  const storage = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
    cookies: document.cookie,
  }));

  expect(storage).toEqual({ local: 0, session: 0, databases: 0, cookies: '' });
  expect(await page.context().cookies()).toEqual([]);
  expect(external).toEqual([]);
});
