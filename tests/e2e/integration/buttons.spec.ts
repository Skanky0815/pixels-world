/* eslint-disable max-lines-per-function -- Echte Tastatur-/Pointerabläufe prüfen gemeinsame Zustände über die bestehenden Seiten hinweg. */
import { test, expect, loadIntro, start, waitForLoadingScreen } from '../support/support';
import { openPause } from '../support/pause-support';
import { TouchDriver } from '../support/touch-support';
import type { Locator, Page } from '@playwright/test';

for (const width of [320, 1280]) {
  test(`Gemeinsame Aktionen bei ${width}px: Linknavigation, Fokus, Hover und Druck @integration`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const play = page.locator('.landing-hero .play-link');

    await expect(play).toHaveAttribute('href', './play.html');
    await expect(page.locator('#install-app')).toHaveAttribute('type', 'button');
    await tabTo(page, play);
    await expect(play).toHaveCSS('outline-style', 'solid');
    await expectTarget(play);
    await page.mouse.move(0, 0);
    const normal = await play.evaluate((node) => getComputedStyle(node).backgroundColor);

    await play.hover();
    const hovered = await play.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(hovered).not.toBe(normal);
    await page.mouse.down();
    const pressed = await play.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(pressed).not.toBe(hovered);
    await page.mouse.up();
    await expect(page).toHaveURL(/\/play\.html$/);
    await waitForLoadingScreen(page);
    const primary = page.locator('[data-menu-play]');

    await tabTo(page, primary);
    await expect(primary).toHaveCSS('outline-style', 'solid');
    await expectTarget(primary);
    await test
      .info()
      .attach(`button-menu-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
    await expect(page.locator('[data-menu-text="menuHelp"]')).toHaveAttribute(
      'href',
      './help.html',
    );
    await page.keyboard.press('Enter');
    await expect(page.locator('.room-selection')).toBeVisible();
    const locked = page.locator('.room-choice:disabled').first();

    await expect(locked).toBeDisabled();
    await expect(locked).toHaveCSS('cursor', 'default');
    await tabTo(page, page.locator('[data-room-start]'));
    await expect(page.locator('[data-room-start]')).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Space');
    await expect(page.locator('.start-copy')).toBeVisible();
  });
}

test('Sprachwahl, Iconbuttons und Albumaktionen behalten Namen, Fokus und gesperrte Zustände @integration', async ({
  page,
}) => {
  await loadIntro(page);
  await openPause(page);
  const english = page.getByRole('button', { name: 'English', exact: true });

  await expect(english).toHaveText('EN');
  await tabTo(page, english);
  await expect(english).toHaveCSS('outline-style', 'solid');
  await expectTarget(english);
  await page.keyboard.press('Space');
  await expect(english).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Deutsch', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.locator('.album-toggle').click();
  const close = page.locator('.album-dialog [data-popup-close]');

  await expect(close).toHaveAccessibleName('Close album');
  await tabTo(page, close);
  await expect(close).toHaveCSS('outline-style', 'solid');
  await expectTarget(close);
  const previous = page.locator('.album-dialog [data-action="page-previous"]');

  await expect(previous).toBeDisabled();
  await expect(previous).toHaveCSS('cursor', 'default');
  await expect(previous).toHaveCSS('opacity', '0.4');
  await expect(page.locator('.album-tile:disabled').first()).toHaveCSS('opacity', '1');
  const bookmark = page.locator('.album-bookmark').first();

  await tabTo(page, bookmark);
  await expect(bookmark).toHaveCSS('outline-width', '3px');
  await page.locator('.album-bookmark[data-room="achievements"]').click();
  await expect(page.locator('.achievement-tile:disabled').first()).toHaveCSS('cursor', 'default');
  await expect(page.locator('.achievement-tile:disabled').first()).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(page.locator('.album-dialog')).toBeHidden();
});

test.describe('Gemeinsame Grundlage mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Haltezustand und größere Steuerflächen bleiben eigenständig @integration', async ({
    page,
  }) => {
    await start(page);
    const touch = await TouchDriver.create(page);
    const right = page.locator('[data-control="right"]');

    await expectTarget(right);
    const normal = await right.evaluate((node) => getComputedStyle(node).backgroundColor);

    await touch.press('right');
    await expect(right).toHaveAttribute('aria-pressed', 'true');
    expect(await right.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(normal);
    await touch.lift();
    await expect(right).toHaveAttribute('aria-pressed', 'false');
    await expect(right).toHaveCSS('background-color', normal);
  });
});

async function expectTarget(target: Locator) {
  const box = await target.boundingBox();

  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 50; step++) {
    await page.keyboard.press('Tab');

    if (await target.evaluate((node) => node === document.activeElement)) return;
  }

  await expect(target).toBeFocused();
}
