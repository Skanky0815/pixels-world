/* eslint-disable max-lines-per-function -- Optionsseite, Tastaturfokus und Rückkehr werden mit echten Eingaben in derselben Runde geprüft. */
import { test, expect, start, state } from '../support/support';

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
])
  test(`Optionen sind ein eigener Bildschirm ohne Hauptmenüaktionen ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await start(page);
    await page.keyboard.press('Escape');
    await page.locator('[data-menu-settings]').click();
    const menu = page.locator('.game-menu');
    const before = await state(page);

    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-label', 'Optionen');
    await expect(page.locator('#play-area')).toBeHidden();
    await expect(menu.locator('.pause-actions')).toBeHidden();
    await expect(menu.locator('[data-menu-back]')).toBeFocused();
    await expect(menu.locator('[data-menu-settings]')).toBeHidden();
    await expect(menu.locator('[data-menu-view="settings"]')).toBeVisible();
    expect(await menu.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await test.info().attach(`Optionen-${viewport.width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.locator('.album-toggle').click();
    await expect(page.locator('.album-dialog')).toBeVisible();
    await page.locator('.album-dialog [data-action="close"]').click();
    await expect(page.locator('.album-toggle')).toBeFocused();
    await expect(menu.locator('[data-menu-view="settings"]')).toBeVisible();
    await page.locator('[data-language="en"]').click();
    await page.clock.runFor(500);
    expect((await state(page)).round.elapsedMs).toBe(before.round.elapsedMs);
    await expect(menu).toHaveAttribute('aria-label', 'Options');
    await page.locator('[data-menu-back]').click();
    await expect(page.locator('[data-menu-settings]')).toBeFocused();
    await expect(menu.locator('.pause-actions')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#play-area')).toBeVisible();
    expect((await state(page)).generation).toBe(before.generation);
  });
