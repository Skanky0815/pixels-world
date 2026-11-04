import { test, expect, state, start, until } from './support';
import { PNG } from 'pngjs';

test('Raum startet und zeichnet sichtbaren Inhalt', async ({ page }) => {
  await start(page);
  await until(page, s => s.pixel.animation === 'idle');
  const snapshot = await state(page);
  expect(snapshot.scene).toBe('LivingRoom');
  expect(snapshot.pixel).toMatchObject({ displayWidth: 64, displayHeight: 64, bodyWidth: 52, bodyHeight: 52 });
  expect(snapshot.room).toEqual({ id: 'living-room', width: 960, height: 540 });
  // Sample the composited browser screenshot; WebGL's back buffer may already be cleared.
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) throw new Error('Canvas nicht sichtbar');
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const image = PNG.sync.read(await page.screenshot({ fullPage: true }));
  const colors = new Set<string>();
  const left = Math.max(0, Math.ceil(bounds.x + scroll.x));
  const top = Math.max(0, Math.ceil(bounds.y + scroll.y));
  for (let y = top; y < Math.min(image.height, top + bounds.height); y += 13) {
    for (let x = left; x < Math.min(image.width, left + bounds.width); x += 13) {
      const index = (y * image.width + x) * 4;
      colors.add(`${image.data[index]},${image.data[index + 1]},${image.data[index + 2]}`);
    }
  }
  expect(colors.size).toBeGreaterThan(8);
  expect(await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, '__pixelTest');
    return !descriptor?.set && Object.isFrozen(window.__pixelTest) && Object.isFrozen(window.__pixelTest?.pixel);
  })).toBe(true);
});

test('Kleiner Viewport zeigt den ganzen Raum ohne Seitenüberlauf', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 720 });
  await start(page);
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Canvas nicht sichtbar');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(481);
  expect(box.y + box.height).toBeLessThanOrEqual(720);
  expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await state(page)).camera).toEqual({ x: 0, y: 0, width: 960, height: 540, zoom: 1 });
});
