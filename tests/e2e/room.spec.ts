import { test as base, expect, type Page } from '@playwright/test';
import type { GameTestState } from '../../src/test-state';

const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'r'];
const test = base.extend<{ healthyBrowser: void }>({
  healthyBrowser: [async ({ page }, use) => {
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('requestfailed', request => failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    try {
      await use();
    } finally {
      if (!page.isClosed()) for (const key of keys) await page.keyboard.up(key);
      expect(failures, 'Keine Browserfehler oder fehlgeschlagenen Ressourcen').toEqual([]);
    }
  }, { auto: true }],
});

async function state(page: Page): Promise<GameTestState> {
  return page.evaluate(() => {
    const snapshot = window.__pixelTest;
    if (!snapshot) throw new Error('Testzustand fehlt');
    return snapshot;
  });
}

async function start(page: Page) {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__pixelTest?.ready)).toBe(true);
  await expect.poll(async () => (await state(page)).pixel.grounded).toBe(true);
  await page.locator('#game').focus();
}

async function until(page: Page, check: (s: GameTestState) => boolean) {
  await expect.poll(async () => {
    const snapshot = await state(page);
    return check(snapshot) ? { matched: true } : { matched: false, snapshot };
  }, { intervals: [16, 25, 50], timeout: 5_000 }).toMatchObject({ matched: true });
}

async function holdUntil(page: Page, held: string[], check: (s: GameTestState) => boolean) {
  try {
    for (const key of held) await page.keyboard.down(key);
    await until(page, check);
  } finally {
    for (const key of held) await page.keyboard.up(key);
  }
}

async function couch(page: Page) {
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.x >= 265);
  await until(page, s => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
}

async function curtain(page: Page) {
  // Walk under the furniture, using only real input to reach the curtain.
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 790);
  await holdUntil(page, ['ArrowUp'], s => s.pixel.climbing && s.pixel.y < 350);
}

async function framesPass(page: Page, count = 15) {
  const frame = (await state(page)).frame;
  await until(page, s => s.frame >= frame + count);
}

async function reset(page: Page) {
  await holdUntil(page, ['r'], s => Math.abs(s.pixel.x - 110) < 2 && !s.pixel.climbing);
  await until(page, s => s.pixel.grounded && Math.abs(s.pixel.x - 110) < 2 && Math.abs(s.pixel.bottom - 468) < 2);
  const { pixel } = await state(page);
  expect(pixel.climbing).toBe(false);
  expect(pixel.gravity).toBe(true);
  expect(pixel.velocityX).toBe(0);
  expect(pixel.velocityY).toBe(0);
}

test('Raum startet und zeichnet sichtbaren Inhalt', async ({ page }) => {
  await start(page);
  const snapshot = await state(page);
  expect(snapshot.scene).toBe('LivingRoom');
  expect(snapshot.room).toEqual({ width: 960, height: 540 });
  // Sample actual rendered pixels, not just canvas dimensions or scene readiness.
  const colors = await page.locator('canvas').evaluate(canvas => new Promise<number>(resolve => {
    requestAnimationFrame(() => {
      const copy = document.createElement('canvas');
      copy.width = 960; copy.height = 540;
      const context = copy.getContext('2d');
      if (!context) throw new Error('Canvas-Kontext fehlt');
      context.drawImage(canvas as HTMLCanvasElement, 0, 0);
      const data = context.getImageData(0, 0, 960, 540).data;
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 4 * 97) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      resolve(colors.size);
    });
  }));
  expect(colors).toBeGreaterThan(8);
  expect(await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, '__pixelTest');
    return !descriptor?.set && Object.isFrozen(window.__pixelTest) && Object.isFrozen(window.__pixelTest?.pixel);
  })).toBe(true);
});

test('Pfeiltasten bewegen Pixel; Boden und Raumgrenze halten ihn auf', async ({ page }) => {
  await start(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x > 150);
  await holdUntil(page, ['ArrowLeft'], s => s.pixel.x <= 13.1);
  await framesPass(page);
  const { pixel } = await state(page);
  expect(pixel.x).toBeGreaterThanOrEqual(0);
  expect(pixel.grounded).toBe(true);
  expect(pixel.bottom).toBeCloseTo(468, 0);
  expect(pixel.velocityY).toBe(0);
});

test('Tastatursprünge landen auf Sofa und erstem Regal', async ({ page }) => {
  await start(page);
  await couch(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 410);
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.x >= 555);
  await until(page, s => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
  expect((await state(page)).pixel.x).toBeLessThan(664);
});

test('Vorhang: hoch, hängen, herunter und abspringen mit Schwerkraft', async ({ page }) => {
  await start(page);
  await curtain(page);
  await until(page, s => s.pixel.climbing && s.pixel.velocityY === 0);
  const hanging = await state(page);
  await framesPass(page);
  expect((await state(page)).pixel.y).toBeCloseTo(hanging.pixel.y, 0);
  expect((await state(page)).pixel.gravity).toBe(false);
  await holdUntil(page, ['ArrowDown'], s => s.pixel.y > hanging.pixel.y + 35);
  await page.keyboard.down('ArrowLeft');
  try {
    await holdUntil(page, ['Space'], s => !s.pixel.climbing && s.pixel.gravity && s.pixel.velocityY < -100);
    await until(page, s => s.pixel.velocityY > 50);
  } finally {
    await page.keyboard.up('ArrowLeft');
  }
  expect((await state(page)).pixel.x).toBeLessThan(hanging.pixel.x - 50);
});

test('R setzt Pixel von einer Plattform zurück', async ({ page }) => {
  await start(page);
  await couch(page);
  await reset(page);
});

test('R beendet Klettern und setzt Bewegung zurück', async ({ page }) => {
  await start(page);
  await curtain(page);
  await reset(page);
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

test('Produktionsbuild enthält keine Test-Schnittstelle', async ({ page }) => {
  await page.goto('http://127.0.0.1:4175/');
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => '__pixelTest' in window)).toBe(false);
  // Also inspect delivered JS, so a delayed dynamic import cannot hide a leak.
  const scripts = await page.locator('script[src]').evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).src));
  expect(scripts.length).toBeGreaterThan(0);
  for (const url of scripts) {
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain('__pixelTest');
  }
});
