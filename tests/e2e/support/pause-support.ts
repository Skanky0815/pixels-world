import type { Page } from '@playwright/test';
import { expect } from './support';

export async function openPause(page: Page) {
  await page.locator('.pause-toggle').click();
  await page.locator('[data-menu-settings]').click();
  await expect(page.locator('.pause-menu')).toBeVisible();
}

export async function changeLanguage(page: Page, language: 'de' | 'en') {
  await openPause(page);
  await page.locator(`.pause-menu [data-language="${language}"]`).click();
  await returnToMenu(page);
  await page.locator('[data-pause-resume]').click();
  await expect(page.locator('.pause-menu')).not.toBeVisible();
}

/** Return from a menu subview through the shared header. */
export async function returnToMenu(page: Page) {
  if (
    (await page.locator('.game-menu').isVisible()) &&
    (await page.locator('.game-menu .pause-actions').isHidden())
  )
    await page.locator('main > header .pause-toggle').click();
}
