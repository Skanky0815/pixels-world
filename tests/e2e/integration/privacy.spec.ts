import { test, expect, waitForLoadingScreen } from '../support/support';

test(
  'Produktionsspiel lädt nur eigene Ressourcen ohne automatische Speicherung laufender Runden',
  { tag: '@integration' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Dokumentnavigation, Datenschutzbeobachtung und vollständige Browser-Assertions bleiben gemeinsam nachvollziehbar.
  }) => {
    const external: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());

      if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1')
        external.push(url.origin);
    });
    await page.goto('http://127.0.0.1:4175/pixels-world/play.html');
    await waitForLoadingScreen(page);
    await page.clock.runFor(1000);
    await expect(page.locator('.game-menu')).toBeVisible();
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
  },
);
