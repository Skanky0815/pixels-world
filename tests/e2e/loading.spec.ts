import { test, expect, type Page } from '@playwright/test';

const loader = '#loading-screen';
const progress = '#loading-progress';

function latch() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { promise, release: () => release() };
}

async function ready(page: Page) {
  await expect(page.locator(loader)).toHaveCount(0);
  await expect(page.locator('.start-screen')).toBeVisible();
  expect(await page.locator('main').evaluate((main) => (main as HTMLElement).inert)).toBe(false);
}

test('Ladescreen erscheint vor dem Spielmodul; Pixel jagt einen rotierenden Ball @smoke', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echtes Zurückhalten des Spielchunks prüft die frühe HTML-Anzeige und die Animation ohne Phaser.
}) => {
  const held = latch();

  await page.route('**/assets/world-*.js', async (route) => {
    await held.promise;
    await route.continue();
  });
  await page.goto('/play.html', { waitUntil: 'commit' });
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator('.loading-pixel')).toBeVisible();
  await expect(page.locator('.loading-ball-art')).toHaveCSS('animation-name', 'loading-roll');
  expect(
    await page
      .locator('.loading-ball-art')
      .evaluate((ball) => getComputedStyle(ball).backgroundImage),
  ).not.toBe('none');
  await expect(page.locator(progress)).not.toHaveAttribute('aria-valuenow');
  await expect(page.locator('canvas')).toHaveCount(0);
  await test
    .info()
    .attach('pixel-jagt-ball', { body: await page.screenshot(), contentType: 'image/png' });
  held.release();
  await ready(page);
});

// eslint-disable-next-line max-lines-per-function -- Ein tatsächlich ausstehendes Asset hält Fortschritt und Start zurück, ohne einen erfundenen Prozentsatz.
test('Assetfortschritt bleibt bis zum echten Abschluss sichtbar', async ({ page }) => {
  const held = latch();

  await page.route('**/assets/vase-0-*.wav', async (route) => {
    await held.promise;
    await route.continue();
  });
  await page.goto('/play.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator(progress).getAttribute('aria-valuenow')).not.toBeNull();
  await expect
    .poll(async () => Number(await page.locator(progress).getAttribute('aria-valuenow')))
    .toBeGreaterThan(0);
  expect(Number(await page.locator(progress).getAttribute('aria-valuenow'))).toBeLessThan(100);
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator('.start-screen')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => performance.now())).toBeGreaterThan(3000);
  held.release();
  await expect(page.locator('.start-screen')).toBeVisible();
  await expect(page.locator(loader)).toHaveCount(0, { timeout: 1000 });
  await ready(page);
});

test('Mindestens zwei Sekunden; frühe Leertaste startet nicht hinter der Anzeige', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Pausierte Browserzeit trennt reale Assetfreigabe, Mindestanzeige und den Verbrauch früher Tastendrücke.
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/play.html');
  await expect(page.locator('canvas')).toHaveCount(1);
  const startedAt = await page.evaluate(() => performance.now());

  await page.clock.runFor(32);
  await expect
    .poll(
      async () => {
        await page.clock.runFor(1);

        return page.locator(progress).getAttribute('aria-valuenow');
      },
      { intervals: [50], timeout: 15_000 },
    )
    .toBe('100');
  await page.clock.runFor(32);
  await expect(page.locator(loader)).toHaveAttribute('data-phase', 'ready');
  const elapsed = (await page.evaluate(() => performance.now())) - startedAt;

  await page.clock.runFor(Math.max(0, 1700 - elapsed));
  await expect(page.locator(loader)).toBeVisible();
  await page.keyboard.down('Space');
  await page.clock.runFor(400);
  await ready(page);
  await page.keyboard.up('Space');
  expect(await page.evaluate(() => window.__pixelTest?.started)).toBe(false);
  await page.locator('#game').focus();
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  expect(await page.evaluate(() => window.__pixelTest?.started)).toBe(true);
});

for (const failure of ['module', 'asset'] as const) {
  // eslint-disable-next-line max-lines-per-function -- Erwarteter Netzwerkfehler, sichtbare Fehlermeldung und echter Reload bleiben ein gemeinsamer Wiederanlauf.
  test(`Ladefehler (${failure}) lässt sich erneut versuchen`, async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(
      failure === 'module' ? '**/assets/world-*.js' : '**/assets/vase-0-*.wav',
      (route) => route.abort(),
    );
    await page.goto('/play.html');
    await expect(page.locator(loader)).toHaveAttribute('data-phase', 'error');
    await expect(page.locator('#loading-status')).toHaveAttribute('role', 'alert');
    await expect(page.getByRole('button', { name: 'Erneut versuchen', exact: true })).toBeVisible();
    await page.unroute(failure === 'module' ? '**/assets/world-*.js' : '**/assets/vase-0-*.wav');
    await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
    await ready(page);
    expect(errors).toEqual([]);
  });
}

test('Ladescreen bleibt auf schmalen Displays lokalisiert und bei reduzierter Bewegung statisch', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Kleine Displays, gespeicherte Sprache und reduzierte Bewegung werden am sichtbaren frühen Bildschirm geprüft.
}) => {
  const held = latch();

  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('pixels-world.language', 'en'));
  await page.route('**/assets/world-*.js', async (route) => {
    await held.promise;
    await route.continue();
  });
  await page.goto('/play.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loading-title')).toHaveText('Getting Pixel’s living room ready …');
  await expect(page.locator('.loading-pixel')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.loading-ball-art')).toHaveCSS('animation-name', 'none');
  expect(
    await page
      .locator('.loading-card')
      .evaluate((card) => card.getBoundingClientRect().right <= innerWidth),
  ).toBe(true);
  await test
    .info()
    .attach('laden-mobil-reduziert', { body: await page.screenshot(), contentType: 'image/png' });
  held.release();
  await ready(page);
});

test('DEV-Ladevorschau zeigt Bewegung und Fehler; Produktionsquery bleibt wirkungslos', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Die sichtbare DEV-Vorschau ist manuell bedienbar, ohne Spielobjekte oder Testsetter bereitzustellen.
}) => {
  await page.goto('http://127.0.0.1:4176/play.html?loading-preview=1');
  await expect(page.getByLabel('Ladefortschritt in der Vorschau')).toBeVisible();
  await expect(page.locator(progress)).toHaveAttribute('aria-valuenow', '45');
  await page.getByLabel('Bewegung reduzieren', { exact: true }).check();
  await expect(page.locator('.loading-ball-art')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Fehler anzeigen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Erneut versuchen', exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:4175/pixels-world/play.html?loading-preview=1');
  await ready(page);
  await expect(page.locator('.loading-preview')).toHaveCount(0);
});
