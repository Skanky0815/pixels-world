import type { Page } from '@playwright/test';
import { holdUntil } from './support';

export async function climbToBall(page: Page) {
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 116);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 835);
  await holdUntil(
    page,
    ['ArrowDown'],
    (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2,
  );
}
