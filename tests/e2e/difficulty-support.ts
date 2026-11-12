import type { Page } from '@playwright/test';
import type { Difficulty } from '../../src/content/difficulty';
import { introAction, loadIntro, until } from './support';

export async function startDifficulty(page: Page, difficulty: Difficulty, path = '/') {
  await loadIntro(page, path);
  await (await introAction(page, 'options')).click();
  await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption(difficulty);
  await page.locator('[data-pause-resume]').click();
  await page.keyboard.down('Space');
  await until(page, (s) => s.started && s.difficulty === difficulty);
  await page.keyboard.up('Space');
  await until(page, (s) => s.pixel.grounded);
}
