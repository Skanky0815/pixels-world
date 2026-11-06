import { test, expect, loadIntro, start, state } from './support';

test('Impressum und Datenschutz sind aus Einführung und Spiel in eigenen Tabs erreichbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
}) => {
  await loadIntro(page);
  await expect(page.getByRole('link', { name: 'Impressum', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Datenschutz', exact: true })).toBeVisible();
  await start(page);
  const before = await state(page);
  const url = page.url();

  for (const [title, path] of [
    ['Impressum', 'impressum.html'],
    ['Datenschutz', 'datenschutz.html'],
  ]) {
    const link = page.getByRole('link', { name: title, exact: true });

    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const opened = page.waitForEvent('popup');

    await link.click();
    const popup = await opened;

    await popup.waitForURL(`**/${path}`);
    await expect(popup.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(
      popup.getByRole('link', { name: 'info@nerd-bubble.de', exact: true }),
    ).toHaveAttribute('href', 'mailto:info@nerd-bubble.de');
    await expect(popup.locator('canvas, script')).toHaveCount(0);
    expect(page.url()).toBe(url);
    expect((await state(page)).generation).toBe(before.generation);
    await popup.close();
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
        .getByRole('link', { name: 'Zum Spiel' })
        .evaluate((link) => (link as HTMLAnchorElement).href),
    ).toBe(`${base}/`);
    await test.info().attach('datenschutz-schmal', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});

test('Produktionsspiel lädt nur eigene Ressourcen und hinterlässt keine persistente Speicherung', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
}) => {
  const external: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') external.push(url.origin);
  });
  await page.goto('http://127.0.0.1:4175/pixels-world/');
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
