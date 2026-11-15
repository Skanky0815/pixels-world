import { test, expect, waitForLoadingScreen, enterSelectedRoom } from '../support/support';

test(
  'Produktionsbuild enthält weder Test-Schnittstelle noch Animationsvergleich',
  { tag: '@smoke' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
  }) => {
    const loadedScripts = new Set<string>();

    page.on('response', (response) => {
      if (new URL(response.url()).pathname.endsWith('.js')) loadedScripts.add(response.url());
    });
    const spriteLoaded = page.waitForResponse(
      (response) =>
        response.url().includes('/pixels-world/assets/') &&
        response.url().endsWith('.png') &&
        response.ok(),
    );

    await page.goto('http://127.0.0.1:4175/pixels-world/');
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.getByRole('link', { name: 'Jetzt spielen →' }).first().click();
    await expect
      .poll(
        async () => {
          await page.clock.runFor(32);

          return page.locator('canvas').count();
        },
        { intervals: [0], timeout: 15_000 },
      )
      .toBe(1);
    await page.clock.runFor(500);
    await spriteLoaded;
    await waitForLoadingScreen(page);
    await enterSelectedRoom(page);
    await expect(page.locator('canvas')).toBeVisible();
    expect(await page.evaluate(() => '__pixelTest' in window)).toBe(false);
    expect(await page.evaluate(() => '__visualFaultDraws' in window)).toBe(false);
    await expect(page.locator('.start-screen')).toBeVisible();
    await page.keyboard.press('F2');
    await expect(page.locator('.game-debug, .game-debug-toggle')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Bereit, Pixel?' })).toBeVisible();
    // Also inspect delivered JS, so a delayed dynamic import cannot hide a leak.
    const scripts = [...loadedScripts];

    expect(scripts.some((url) => /\/world-[^/]+\.js$/.test(url))).toBe(true);

    for (const url of scripts) {
      const response = await page.request.get(url);

      expect(response.ok()).toBe(true);
      const source = await response.text();

      expect(source).not.toContain('__pixelTest');
      expect(source).not.toContain('__visualFaultDraws');
      expect(source).not.toContain('round-profile');
      expect(source).not.toContain('__E2E_ROUND_CONFIG__');
      expect(source).not.toContain('Vergleichsansicht unvollständig');
      expect(source).not.toContain('InteractablePlayground');
      expect(source).not.toContain('impact-vases');
      expect(source).not.toContain('fridge-incoming');
      expect(source).not.toContain('BallPlayPreview');
      expect(source).not.toContain('Charme-Vorschau fehlt');
      expect(source).not.toContain('GameDebug');
      expect(source).not.toContain('dev-scenario');
      expect(source).not.toContain('Ladefortschritt in der Vorschau');
    }

    for (const base of ['http://127.0.0.1:4174', 'http://127.0.0.1:4175/pixels-world']) {
      for (const path of [
        '/animation-compare.html',
        '/charm-preview.html',
        '/game/dev/charm-preview.ts',
        '/game/dev/charm-preview.css',
        '/game/dev/CharmPreview.ts',
        '/game/dev/pixel-compare-charm.ts',
        '/portrait-preview.html',
        '/game/dev/portrait-preview.ts',
        '/game/dev/portrait-preview.css',
        '/ball-play-preview.html',
        '/game/dev/ball-play-preview.ts',
        '/game/dev/BallPlayPreview.ts',
        '/interactable-playground.html',
        '/game/dev/game-debug.ts',
        '/game/dev/loading-preview.ts',
        '/game/dev/game-debug.css',
        '/game/dev/game-debug-model.ts',
        '/game/dev/interactable-playground.ts',
        '/game/dev/interactable-playground.css',
        '/game/dev/PlaygroundScene.ts',
        '/game/dev/playground-room.ts',
        '/game/dev/playground-selection.ts',
        '/game/dev/playground-diagnostics.ts',
        '/game/dev/animation-compare.ts',
        '/game/dev/sara-compare.ts',
        '/game/dev/pixel-compare.ts',
        '/game/dev/preview-playback.ts',
        '/game/dev/animation-compare.css',
        '/src/animation-compare.ts',
        '/src/animation-compare.css',
      ]) {
        const response = await page.request.get(base + path);

        expect(response.status(), `${base}${path} ist kein Build-Artefakt`).toBe(404);
      }
    }
  },
);

test(
  'Verschobene HTML-Quellen behalten direkte öffentliche URLs und gebündelte Ressourcen',
  { tag: '@integration' },
  async ({ request }) => {
    await checkPublicPages(request);
  },
);

// eslint-disable-next-line max-lines-per-function -- Direkte Seitenaufrufe prüfen denselben Routingvertrag in drei Auslieferungsarten.
async function checkPublicPages(request: import('@playwright/test').APIRequestContext) {
  for (const base of [
    'http://127.0.0.1:4174/',
    'http://127.0.0.1:4175/pixels-world/',
    'http://127.0.0.1:4176/',
  ]) {
    for (const path of [
      '',
      'play.html',
      'help.html',
      'impressum.html',
      'datenschutz.html',
      'update.html',
    ]) {
      const response = await request.get(`${base}${path}?route-check=1`);

      expect(response.ok(), `${base}${path}`).toBe(true);
      const html = await response.text();

      expect(html).toContain('<!doctype html>');
      expect(html).not.toContain('<!-- GAME_HEADER -->');
      expect(html).not.toContain('<!-- LANDING_HEADER -->');
      const resources = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|ts|css))"/g)];

      for (const [, resource] of resources)
        expect((await request.get(new URL(resource, response.url()).href)).ok(), resource).toBe(
          true,
        );
    }
  }
}
