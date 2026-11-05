import { test, expect } from './support';

test('Produktionsbuild enthält weder Test-Schnittstelle noch Animationsvergleich', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  const spriteLoaded = page.waitForResponse(
    (response) =>
      response.url().includes('/pixels-world/assets/') &&
      response.url().endsWith('.png') &&
      response.ok(),
  );

  await page.goto('http://127.0.0.1:4175/pixels-world/');
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
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => '__pixelTest' in window)).toBe(false);
  // Also inspect delivered JS, so a delayed dynamic import cannot hide a leak.
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((elements) => elements.map((element) => (element as HTMLScriptElement).src));

  expect(scripts.length).toBeGreaterThan(0);

  for (const url of scripts) {
    const response = await page.request.get(url);

    expect(response.ok()).toBe(true);
    const source = await response.text();

    expect(source).not.toContain('__pixelTest');
    expect(source).not.toContain('round-profile');
    expect(source).not.toContain('__E2E_ROUND_CONFIG__');
    expect(source).not.toContain('Vergleichsansicht unvollständig');
  }

  for (const base of ['http://127.0.0.1:4174', 'http://127.0.0.1:4175/pixels-world']) {
    for (const path of [
      '/animation-compare.html',
      '/src/dev/animation-compare.ts',
      '/src/dev/animation-compare.css',
      '/src/animation-compare.ts',
      '/src/animation-compare.css',
    ]) {
      const response = await page.request.get(base + path);

      expect(response.status(), `${base}${path} ist kein Build-Artefakt`).toBe(404);
    }
  }
});
