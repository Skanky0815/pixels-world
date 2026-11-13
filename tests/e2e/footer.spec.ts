import { test, expect, waitForLoadingScreen, enterSelectedRoom } from './support';
import { readFileSync } from 'node:fs';
const packageVersion = (
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

test('Footer zeigt aktuelles Jahr und zentrale Build-Version außerhalb der Spielfläche', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  for (const base of [
    'http://127.0.0.1:4174/play.html',
    'http://127.0.0.1:4175/pixels-world/play.html?room=cozy-remix',
  ]) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(base);
    await waitForLoadingScreen(page);
    await expect(page.locator('h1 span')).toHaveText('01 / DAS WOHNZIMMER');
    const year = await page.evaluate(() => new Date().getFullYear());
    const footer = page.locator('#build-info');

    await expect(footer).toHaveText(`© ${year} Pixel's World · v${packageVersion}`);
    await expect(footer).toBeVisible();
    const shell = await page.locator('main > header, main > footer').elementHandles();
    const selection = await page.locator('.room-selection').boundingBox();
    const selectionFooter = await footer.boundingBox();

    footerBelow(selection, selectionFooter);
    await enterSelectedRoom(page);
    expect(
      await Promise.all(shell.map((node) => node.evaluate((element) => element.isConnected))),
    ).toEqual([true, true]);
    const releaseTag = base.includes(':4175') && process.env.PIXELS_RELEASE_TAG;

    if (releaseTag) {
      await expect(footer.getByRole('link')).toHaveAttribute(
        'href',
        `https://github.com/Skanky0815/pixels-world/releases/tag/${encodeURIComponent(releaseTag)}`,
      );
      await expect(footer.getByRole('link')).toHaveAttribute('target', '_blank');
      await expect(footer.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    } else await expect(footer.getByRole('link')).toHaveCount(0);
    const footerBox = await footer.boundingBox(),
      gameBox = await page.locator('#game').boundingBox();

    expect(footerBox && gameBox && footerBox.y >= gameBox.y + gameBox.height).toBe(true);
    const feedbackBox = await page.getByRole('link', { name: 'Feedback & Ideen' }).boundingBox();

    expect(feedbackBox).not.toBeNull();

    if (!feedbackBox || !footerBox) throw new Error('Footer-Zeile fehlt');
    expect(Math.abs(feedbackBox.y - footerBox.y)).toBeLessThan(6);
    expect(feedbackBox.x).toBeLessThan(footerBox.x);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(footer).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

function footerBelow(area: { y: number; height: number } | null, footer: { y: number } | null) {
  if (!area || !footer) throw new Error('Auswahl oder Footer fehlt');
  expect(footer.y).toBeGreaterThanOrEqual(area.y + area.height);
}
