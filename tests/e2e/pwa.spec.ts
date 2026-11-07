import { PNG } from 'pngjs';
import type { Page } from '@playwright/test';
import { test, expect } from './support';

test('Installationshilfe erklärt iPhone und Browser in DE/EN und bleibt mobil lesbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Hilfe, Sprache und Schließen bilden gemeinsam den vollständigen Installationsablauf.
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Als App installieren', exact: true }).click();
  const help = page.getByRole('dialog', { name: 'Als App installieren', exact: true });

  await expect(help).toContainText('Zum Home-Bildschirm');
  expect(await help.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Install app', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Install app', exact: true })).toContainText(
    'Add to Home Screen',
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();
});

for (const outcome of ['accepted', 'dismissed'] as const) {
  // eslint-disable-next-line max-lines-per-function -- Nur das Browser-Installationsereignis wird nachgebildet; die sichtbare Reaktion bleibt echte UI.
  test(`Nativer Installationsdialog: ${outcome}`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((result) => {
      const event = new Event('beforeinstallprompt', { cancelable: true });

      Object.defineProperties(event, {
        prompt: { value: async () => undefined },
        userChoice: { value: Promise.resolve({ outcome: result }) },
      });
      window.dispatchEvent(event);
    }, outcome);
    const button = page.getByRole('button', { name: 'Als App installieren', exact: true });

    await button.click();
    await expect(page.locator('.install-dialog')).toBeHidden();

    if (outcome === 'accepted') await expect(button).toBeHidden();
    else await expect(button).toBeVisible();
  });
}

for (const base of ['http://127.0.0.1:4177/', 'http://127.0.0.1:4175/pixels-world/']) {
  test(`Webapp startet offline und behält echte Seiten unter ${new URL(base).pathname}`, async ({
    page,
    context,
    // eslint-disable-next-line max-lines-per-function -- Manifest, Registrierung, Offline-Spiel und Rückweg werden unter demselben Produktions-Scope geprüft.
  }) => {
    await page.goto(base);
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(
      await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
    ).toBe(0);
    const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');

    if (!manifestUrl) throw new Error('Manifest fehlt');
    const response = await page.request.get(new URL(manifestUrl, base).href);
    const manifest = await response.json();

    expect(new URL(manifest.start_url, new URL(manifestUrl, base)).href).toBe(base + 'play.html');
    expect(new URL(manifest.scope, new URL(manifestUrl, base)).href).toBe(base);
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual([
      '192x192',
      '512x512',
      '512x512',
    ]);
    const session = await context.newCDPSession(page);
    const reported = await session.send('Page.getAppManifest');

    expect(reported.errors).toEqual([]);
    await session.detach();
    await page.getByRole('link', { name: 'Jetzt spielen →' }).first().click();
    await waitForIntro(page);
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();

            return registration?.active?.state;
          }),
        { timeout: 20_000 },
      )
      .toBe('activated');
    expect(await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.scope))).toBe(
      base,
    );
    await context.setOffline(true);

    try {
      await page.goto(base + 'play.html');
      await waitForIntro(page);
      await page.locator('#game').focus();
      await page.keyboard.down('Space');
      await page.clock.runFor(200);
      await page.keyboard.up('Space');
      await expect(page.locator('.start-screen')).toBeHidden();
      await expectDrawnRoom(page);
      await page.getByRole('button', { name: 'Menü', exact: true }).click();
      await page.getByRole('link', { name: 'Beenden', exact: true }).click();
      await expect(page).toHaveURL(base);
      await expect(page.locator('h1')).toHaveText('Ein Zimmer. Eine Katze. Dein Chaos.');
      await page.getByRole('link', { name: 'Impressum', exact: true }).click();
      await expect(page).toHaveURL(base + 'impressum.html');
      await expect(page.getByRole('heading', { name: 'Impressum', exact: true })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
}

async function waitForIntro(page: Page) {
  await expect
    .poll(async () => {
      await page.clock.runFor(32);

      return page.locator('.start-screen:visible').count();
    })
    .toBe(1);
}

// eslint-disable-next-line max-lines-per-function -- Eine tatsächliche Aufnahme prüft Wand und Boden und bleibt als visueller Nachweis angehängt.
async function expectDrawnRoom(page: Page) {
  const canvas = page.locator('canvas');

  await canvas.scrollIntoViewIfNeeded();
  await page.clock.runFor(32);
  const capture = await canvas.screenshot();
  const image = PNG.sync.read(capture);
  const sample = (ratio: number) => [
    ...image.data.subarray(
      (Math.floor(image.height * ratio) * image.width + 10) * 4,
      (Math.floor(image.height * ratio) * image.width + 10) * 4 + 3,
    ),
  ];

  expect(sample(0.1)).not.toEqual(sample(0.95));
  await test.info().attach('offline-room', { body: capture, contentType: 'image/png' });
}
