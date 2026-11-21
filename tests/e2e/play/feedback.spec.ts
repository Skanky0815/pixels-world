import { test, expect, start, state } from '../support/support';
import type { Page } from '@playwright/test';
import { returnToMenu } from '../support/pause-support';

const destination = 'https://github.com/Skanky0815/pixels-world/issues/new/choose';

async function interceptFeedback(page: Page) {
  await page
    .context()
    .route(destination, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>GitHub-Issue-Auswahl</title>' }),
    );
}

async function information(page: Page) {
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-information]').click();

  return page.locator('[data-game-information]').getByRole('link', { name: 'Feedback & Ideen' });
}

test('Feedback öffnet die Issue-Auswahl in einem neuen Tab; Rückkehr erhält die Runde', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Ein zusammenhängender Browserablauf prüft Link, Tastatur und unveränderten Spielzustand.
}) => {
  await interceptFeedback(page);
  await start(page);
  const url = page.url();
  const before = await state(page);
  const link = await information(page);

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('#feedback-note')).toHaveCount(0);
  const opened = page.waitForEvent('popup');

  await link.click();
  const popup = await opened;

  await popup.waitForURL(destination);
  expect(page.url()).toBe(url);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await state(page);

  await page.clock.runFor(5000);
  expect((await state(page)).round).toEqual(paused.round);
  expect((await state(page)).generation).toBe(before.generation);
  await popup.close();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await returnToMenu(page);
  await page.locator('[data-pause-resume]').click();
  await page.locator('#game').focus();
  await page.clock.runFor(200);
  expect((await state(page)).round.elapsedMs).toBeGreaterThan(paused.round.elapsedMs);
});

test('Feedback-Link ist per Tastatur erreichbar und blockiert Spieltasten während des Fokus', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Ein zusammenhängender Browserablauf prüft Link, Tastatur und unveränderten Spielzustand.
}) => {
  await interceptFeedback(page);
  await start(page);
  await page.locator('.pause-toggle').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-menu-information]').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  const link = page
    .locator('[data-game-information]')
    .getByRole('link', { name: 'Feedback & Ideen' });

  await expect(link).toBeFocused();
  const before = await state(page);

  for (const key of ['Space', 'r', 'ArrowRight']) await page.keyboard.down(key);
  await page.clock.runFor(500);
  const after = await state(page);

  expect(after.generation).toBe(before.generation);
  expect(after.pixel.x).toBeCloseTo(before.pixel.x, 0);
  expect(after.pixel.bottom).toBeCloseTo(468, 0);

  for (const key of ['Space', 'r', 'ArrowRight']) await page.keyboard.up(key);
  const opened = page.waitForEvent('popup');

  await page.keyboard.press('Enter');
  const popup = await opened;

  await popup.waitForURL(destination);
  await popup.close();
});

// eslint-disable-next-line max-lines-per-function -- Schmale Darstellung wird geometrisch gegen Spielbereich und Dokumentbreite geprüft.
test('Feedback bleibt im schmalen Fenster in der Spielinformation erreichbar', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 720 });
  await start(page);
  const link = await information(page);

  await link.scrollIntoViewIfNeeded();
  const linkBox = await link.boundingBox();
  const menuBox = await page.locator('.game-menu').boundingBox();

  expect(linkBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  await expect(page.locator('#play-area')).toBeHidden();

  if (!linkBox || !menuBox) throw new Error('Feedback oder Spielinformation fehlt');
  expect(linkBox.y).toBeGreaterThanOrEqual(menuBox.y);
  expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(menuBox.y + menuBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await test
    .info()
    .attach('feedback-schmal', { body: await page.screenshot(), contentType: 'image/png' });
});
