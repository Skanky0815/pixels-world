import { test, expect } from './support';
import { readFileSync } from 'node:fs';
const packageVersion = (
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

test('Footer zeigt aktuelles Jahr und zentrale Build-Version außerhalb der Spielfläche', async ({
  page,
}) => {
  for (const base of [
    'http://127.0.0.1:4174/',
    'http://127.0.0.1:4175/pixels-world/?room=cozy-remix',
  ]) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(base);
    await expect(page.locator('h1 span')).toHaveText('01 / THE LIVING ROOM');
    const year = await page.evaluate(() => new Date().getFullYear());
    const footer = page.locator('#build-info');

    await expect(footer).toHaveText(`© ${year} Pixel's World · v${packageVersion}`);
    await expect(footer).toBeVisible();
    const footerBox = await footer.boundingBox(),
      gameBox = await page.locator('#game').boundingBox();

    expect(footerBox && gameBox && footerBox.y >= gameBox.y + gameBox.height).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(footer).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
