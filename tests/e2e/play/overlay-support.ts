import { expect, type Page } from '@playwright/test';
import { state } from '../support/support';

/** Wait for the actual content-sized canvas after both browser resize and the next game frame. */
export async function fullViewport(page: Page) {
  await expect.poll(() => fitsViewport(page), { intervals: [0] }).toBe(true);
}

// eslint-disable-next-line max-lines-per-function -- Eine geometrische Gegenprobe umfasst beide Kanten und beide Abmessungen.
async function fitsViewport(page: Page) {
  await page.clock.runFor(100);
  const box = (await page.locator('canvas').boundingBox())!;
  const viewport = (await page.locator('#game-content').boundingBox())!;

  return (
    Math.max(
      Math.abs(box.x - viewport.x),
      Math.abs(box.y - viewport.y),
      Math.abs(box.width - viewport.width),
      Math.abs(box.height - viewport.height),
    ) < 1
  );
}

/** Project authored actor bounds through the real camera, rather than moving test state. */
// eslint-disable-next-line max-lines-per-function -- Figuren und DOM-Grenzen werden aus demselben unveränderlichen Ergebnisframe projiziert.
export async function actorsClear(page: Page) {
  const viewport = page.viewportSize()!;

  if (viewport.width > viewport.height) return;
  const s = await state(page);
  const banner = (await page.locator('.album-banner').boundingBox())!;
  const dialog = (await page.locator('.mobile-dialogue').boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;
  const viewTop = s.camera.y + (s.camera.height - s.camera.height / s.camera.zoom) / 2;
  const project = (y: number) =>
    canvas.y + ((y - viewTop) * s.camera.zoom * canvas.height) / s.camera.height;

  if (viewport.width < viewport.height)
    expect(project(s.sara.soleY - s.sara.displayHeight * s.sara.originY)).toBeGreaterThanOrEqual(
      dialog.y + dialog.height,
    );
  expect(project(s.sara.soleY + s.sara.displayHeight * (1 - s.sara.originY))).toBeLessThanOrEqual(
    banner.y,
  );
  expect(project(s.pixel.bottom)).toBeLessThanOrEqual(banner.y);
}
