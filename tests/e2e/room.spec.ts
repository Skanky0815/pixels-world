import { test as base, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import type { GameTestState } from '../../src/test-state';

const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'r'];
const test = base.extend<{ healthyBrowser: void }>({
  healthyBrowser: [async ({ page }, use) => {
    const clockStart = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: clockStart });
    await page.clock.pauseAt(new Date(clockStart.getTime() + 1000));
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
  await expect.poll(async () => {
    await page.clock.runFor(32);
    return page.evaluate(() => window.__pixelTest?.ready);
  }, { intervals: [0], timeout: 15_000 }).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
  await until(page, s => s.pixel.grounded);
  await page.locator('#game').focus();
}

async function until(page: Page, check: (s: GameTestState) => boolean) {
  await expect.poll(async () => {
    // Real keyboard input, deterministic simulation steps: runner latency must not hold a key longer.
    await page.clock.runFor(32);
    const snapshot = await state(page);
    return check(snapshot) ? { matched: true } : { matched: false, snapshot };
  }, { intervals: [0], timeout: 15_000 }).toMatchObject({ matched: true });
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
  await until(page, s => s.pixel.animation === 'idle');
  const snapshot = await state(page);
  expect(snapshot.scene).toBe('LivingRoom');
  expect(snapshot.pixel).toMatchObject({ displayWidth: 64, displayHeight: 64, bodyWidth: 52, bodyHeight: 52 });
  expect(snapshot.room).toEqual({ width: 960, height: 540 });
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

test('Pfeiltasten bewegen Pixel; Boden und Raumgrenze halten ihn auf', async ({ page }) => {
  await start(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x > 150);
  await holdUntil(page, ['ArrowLeft'], s => s.pixel.left <= 0.1);
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

test('Vorhang: hoch, langsam rutschen, herunter und abspringen mit Schwerkraft', async ({ page }) => {
  await start(page);
  await curtain(page);
  await until(page, s => s.curtain.state === 'sliding');
  const slidingStart = await state(page);
  await framesPass(page);
  expect((await state(page)).pixel.y).toBeGreaterThan(slidingStart.pixel.y + 4);
  expect((await state(page)).pixel.y).toBeLessThan(slidingStart.pixel.y + 20);
  expect((await state(page)).pixel.gravity).toBe(false);
  await holdUntil(page, ['ArrowDown'], s => s.pixel.y > slidingStart.pixel.y + 35);
  await page.keyboard.down('ArrowLeft');
  try {
    await holdUntil(page, ['Space'], s => !s.pixel.climbing && s.pixel.gravity && s.pixel.velocityY < -100);
    await until(page, s => s.pixel.velocityY > 50);
  } finally {
    await page.keyboard.up('ArrowLeft');
  }
  expect((await state(page)).pixel.x).toBeLessThan(slidingStart.pixel.x - 50);
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

test('Sprung behält Schwung ohne Richtungstaste und erlaubt Luftsteuerung', async ({ page }) => {
  await start(page);
  // Test air momentum in the open floor area, away from the couch side.
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 460);
  await until(page, s => s.pixel.grounded && s.pixel.velocityX === 0);
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.y < 400 && s.pixel.velocityX > 200);
  const jumping = await state(page);
  await framesPass(page, 6);
  const drifting = await state(page);
  expect(drifting.pixel.grounded).toBe(false);
  expect(drifting.pixel.x).toBeGreaterThan(jumping.pixel.x + 12);
  expect(drifting.pixel.velocityX).toBeGreaterThan(200);
  await holdUntil(page, ['ArrowLeft'], s => s.pixel.velocityX < 0);
});

test('Vorhang wird beim Anspringen ohne Hoch/Runter automatisch gegriffen', async ({ page }) => {
  await start(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 680);
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.climbing);
  await until(page, s => s.curtain.state === 'sliding' && s.pixel.velocityX === 0);
  expect((await state(page)).pixel.velocityY).toBe(35);
  expect((await state(page)).pixel.gravity).toBe(false);
});

test('Klettern kollidiert mit Regalunterseite und Boden', async ({ page }) => {
  await start(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 680);
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.climbing);
  // On the left edge of the curtain, the second shelf extends overhead to x=744.
  await holdUntil(page, ['ArrowUp'], s => s.pixel.top <= 242);
  await page.keyboard.down('ArrowUp');
  try {
    await framesPass(page, 20);
    const blocked = await state(page);
    expect(blocked.pixel.top).toBeGreaterThanOrEqual(239);
    expect(blocked.pixel.top).toBeLessThan(243);
    expect(blocked.pixel.climbing).toBe(true);
  } finally { await page.keyboard.up('ArrowUp'); }
  await holdUntil(page, ['ArrowDown'], s => s.pixel.bottom >= 467);
  await page.keyboard.down('ArrowDown');
  try {
    await framesPass(page, 20);
    expect((await state(page)).pixel.bottom).toBeCloseTo(468, 0);
  } finally { await page.keyboard.up('ArrowDown'); }
});

async function firstVase(page: Page) {
  await couch(page);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 410);
  await holdUntil(page, ['Space', 'ArrowRight'], s => s.pixel.x >= 550);
  await until(page, s => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
  await holdUntil(page, ['ArrowRight'], s => s.vases[0].state !== 'resting');
}

test('Vase bleibt stehen; Anschubsen und Fallen geben erst beim Bruch Punkte', async ({ page }, testInfo) => {
  await start(page);
  await framesPass(page, 30);
  const initial = await state(page);
  expect(initial.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(initial.vases.every(vase => vase.state === 'resting')).toBe(true);
  expect(initial.vases[0].x).toBeCloseTo(620, 0);
  await firstVase(page);
  const pushed = await state(page);
  expect(pushed.vases[0].state).not.toBe('broken');
  expect(pushed.chaos.score).toBe(0);
  await until(page, s => s.vases[0].state === 'falling');
  expect((await state(page)).chaos.score).toBe(0);
  await until(page, s => s.vases[0].state === 'broken');
  expect((await state(page)).chaos).toEqual({ score: 25, damagedObjects: 1, anger: 'annoyed' });
  const screenshot = testInfo.outputPath('chaos.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Chaos nach Vasenbruch', { path: screenshot, contentType: 'image/png' });
  await framesPass(page, 45);
  expect((await state(page)).chaos.score).toBe(25);
  await reset(page);
  const restarted = await state(page);
  expect(restarted.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(restarted.vases.every(vase => vase.state === 'resting')).toBe(true);
  expect(restarted.vases[0].x).toBeCloseTo(620, 0);
  // The same object may score again in a new run, but not twice in one run.
  await firstVase(page);
  await until(page, s => s.vases[0].state === 'broken');
  expect((await state(page)).chaos.score).toBe(25);
});

test('Alle drei Vasen sind erreichbar und summieren Schaden über die Ärgerstufen', async ({ page }) => {
  await start(page);
  await firstVase(page);
  await until(page, s => s.vases[0].state === 'broken');
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], s => s.pixel.bottom <= 195);
  await holdUntil(page, ['ArrowLeft'], s => s.vases[1].state !== 'resting');
  expect((await state(page)).chaos.score).toBe(25 + (await state(page)).curtain.damage * 4);
  await until(page, s => s.vases[1].state === 'broken');
  const second = await state(page);
  expect(second.chaos).toEqual({ score: 60 + second.curtain.damage * 4, damagedObjects: 2 + Number(second.curtain.damage > 0), anger: 'angry' });
  await framesPass(page, 30);
  expect((await state(page)).chaos.score).toBe(60 + (await state(page)).curtain.damage * 4);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], s => s.pixel.bottom <= 116);
  // With the larger body, first land beside the vase instead of stepping over it.
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 850);
  await holdUntil(page, ['ArrowDown'], s => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2);
  await holdUntil(page, ['ArrowRight'], s => s.vases[2].state !== 'resting');
  await until(page, s => s.vases[2].state === 'broken');
  const complete = await state(page);
  expect(complete.chaos).toEqual({ score: 100 + complete.curtain.damage * 4, damagedObjects: 3 + Number(complete.curtain.damage > 0), anger: 'angry' });
});

async function besideCouch(page: Page) {
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 185);
  await until(page, s => s.pixel.velocityX === 0 && s.couch.state === 'waiting');
}

test('Sofa: verzögertes Kratzen, Animation, progressive Ereignisse und Bewegungsabbruch', async ({ page }, testInfo) => {
  await start(page);
  await besideCouch(page);
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(0);
  await until(page, s => s.couch.state === 'scratching' && s.couch.damage === 1);
  const first = await state(page);
  expect(first.pixel.animation).toBe('scratch');
  expect(first.pixel).toMatchObject({ displayWidth: 80, displayHeight: 80, bodyWidth: 52, bodyHeight: 52 });
  expect(first.couch.events).toBe(1);
  expect(first.chaos.score).toBe(3);
  expect(first.chaos.damagedObjects).toBe(1);
  expect(first.couch.lastDamage).toEqual({ objectId: 'couch', kind: 'scratch', stage: 1, value: 3 });
  await until(page, s => s.pixel.animationFrame !== first.pixel.animationFrame);
  expect((await state(page)).couch.damage).toBe(1);
  await until(page, s => s.couch.damage === 2);
  const screenshot = testInfo.outputPath('couch-scratching.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Automatisches Sofakratzen', { path: screenshot, contentType: 'image/png' });
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 490);
  expect((await state(page)).couch.state).toBe('idle');
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  const stopped = (await state(page)).couch.damage;
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(stopped);
  expect((await state(page)).chaos.score).toBe(stopped * 3);
});

test('Sofa: Springen unterbricht, erneutes Warten und Reset entfernen den Schaden', async ({ page }) => {
  await start(page);
  await besideCouch(page);
  await until(page, s => s.couch.damage === 1);
  await holdUntil(page, ['Space'], s => !s.pixel.grounded);
  expect((await state(page)).couch.state).toBe('idle');
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await until(page, s => s.pixel.grounded && s.couch.state === 'waiting');
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(1);
  await until(page, s => s.couch.damage === 2);
  await reset(page);
  expect((await state(page)).couch).toEqual({ state: 'idle', damage: 0, events: 0, lastDamage: null });
  expect((await state(page)).chaos.score).toBe(0);
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await besideCouch(page);
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(0);
  await until(page, s => s.couch.damage === 1);
});

test('Sofa: gedeckelter Schaden, keine Punkteflut und kein Kratzen außerhalb der Nähe', async ({ page }) => {
  await start(page);
  await page.clock.runFor(4000);
  expect((await state(page)).couch.damage).toBe(0);
  await besideCouch(page);
  await page.clock.runFor(9000);
  const damaged = await state(page);
  expect(damaged.couch.damage).toBe(6);
  expect(damaged.couch.events).toBe(6);
  expect(damaged.chaos.score).toBe(18);
  expect(damaged.chaos.damagedObjects).toBe(1);
  await page.clock.runFor(2000);
  expect((await state(page)).couch.events).toBe(6);
  expect((await state(page)).chaos.score).toBe(18);
});

test('Vorhang: progressive Risse zählen Punkte; Weiterklettern und Absprung stoppen Schaden', async ({ page }, testInfo) => {
  await start(page);
  await curtain(page);
  await holdUntil(page, ['ArrowUp'], s => s.pixel.y < 230);
  await until(page, s => s.curtain.state === 'sliding');
  const beginning = await state(page);
  await page.clock.runFor(300);
  const slipping = await state(page);
  expect(slipping.pixel.y).toBeGreaterThan(beginning.pixel.y + 6);
  expect(slipping.pixel.y).toBeLessThan(beginning.pixel.y + 20);
  expect(slipping.curtain.damage).toBe(0);
  await until(page, s => s.curtain.damage === 1);
  expect((await state(page)).chaos).toEqual({ score: 4, damagedObjects: 1, anger: 'calm' });
  expect((await state(page)).curtain.lastDamage).toEqual({ objectId: 'curtain', kind: 'tear', stage: 1, value: 4 });
  const screenshot = testInfo.outputPath('curtain-tearing.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Rutschender Pixel und Vorhangriss', { path: screenshot, contentType: 'image/png' });
  await page.keyboard.down('ArrowUp');
  try {
    await until(page, s => s.curtain.state === 'climbing' && s.pixel.velocityY < 0);
    await page.clock.runFor(300);
    expect((await state(page)).curtain.damage).toBe(1);
  } finally { await page.keyboard.up('ArrowUp'); }
  await until(page, s => s.curtain.damage === 2);
  expect((await state(page)).chaos.score).toBe(8);
  await holdUntil(page, ['Space', 'ArrowLeft'], s => s.curtain.state === 'detached' && s.pixel.gravity);
  await page.clock.runFor(300);
  expect((await state(page)).curtain.damage).toBe(2);
  expect((await state(page)).chaos.score).toBe(8);
});

test('Vorhang: Boden löst den Griff; erneutes Klettern und Reset funktionieren', async ({ page }) => {
  await start(page);
  await curtain(page);
  await until(page, s => s.curtain.state === 'sliding');
  await holdUntil(page, ['ArrowDown'], s => s.pixel.grounded && s.curtain.state === 'detached');
  expect((await state(page)).pixel.bottom).toBeCloseTo(468, 0);
  const grounded = await state(page);
  await page.clock.runFor(1200);
  expect((await state(page)).curtain.events).toBe(grounded.curtain.events);
  expect((await state(page)).curtain.state).toBe('detached');
  await holdUntil(page, ['ArrowUp'], s => s.curtain.state === 'climbing' && s.pixel.y < 420);
  await reset(page);
  expect((await state(page)).curtain).toEqual({ state: 'detached', damage: 0, events: 0, lastDamage: null });
  expect((await state(page)).chaos.score).toBe(0);
});

test('Produktionsbuild enthält keine Test-Schnittstelle', async ({ page }) => {
  await page.goto('http://127.0.0.1:4175/');
  await expect.poll(async () => {
    await page.clock.runFor(32);
    return page.locator('canvas').count();
  }, { intervals: [0], timeout: 15_000 }).toBe(1);
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => '__pixelTest' in window)).toBe(false);
  // Also inspect delivered JS, so a delayed dynamic import cannot hide a leak.
  const scripts = await page.locator('script[src]').evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).src));
  expect(scripts.length).toBeGreaterThan(0);
  for (const url of scripts) {
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    const source = await response.text();
    expect(source).not.toContain('__pixelTest');
  }
});

async function besidePlant(page: Page) {
  await holdUntil(page, ['ArrowLeft'], s => s.pixel.x <= 103);
  await until(page, s => s.pixel.velocityX === 0 && s.plant.state === 'waiting');
}

test('Katzengras: Wartezeit, Knabberanimation und Wackeln; Weglaufen verhindert Kippen', async ({ page }, testInfo) => {
  await start(page);
  await besidePlant(page);
  await page.clock.runFor(1500);
  expect((await state(page)).plant.damage).toBe(0);
  await until(page, s => s.plant.state === 'nibbling');
  const first = await state(page);
  expect(first.pixel.animation).toBe('nibble');
  expect(first.pixel).toMatchObject({ displayWidth: 80, displayHeight: 80, bodyWidth: 52, bodyHeight: 52 });
  expect(first.plant.lastDamage).toEqual({ objectId: 'plant', kind: 'nibble', stage: 1, value: 2 });
  expect(first.chaos).toEqual({ score: 2, damagedObjects: 1, anger: 'calm' });
  await until(page, s => s.pixel.animationFrame !== first.pixel.animationFrame);
  await until(page, s => s.plant.state === 'wobbling' && Math.abs(s.plant.angle) > 4);
  const screenshot = testInfo.outputPath('plant-warning.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Knabbern mit sichtbarer Wackelwarnung', { path: screenshot, contentType: 'image/png' });
  await holdUntil(page, ['ArrowRight'], s => s.pixel.x >= 120);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).plant.angle).toBe(0);
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await page.clock.runFor(1500);
  expect((await state(page)).plant.damage).toBe(1);
  expect((await state(page)).chaos.score).toBe(2);
});

test('Katzengras: Topf kippt nach Warnung, zählt einmal und R stellt alles wieder her', async ({ page }, testInfo) => {
  await start(page);
  await besidePlant(page);
  await until(page, s => s.plant.state === 'wobbling');
  await page.clock.runFor(600);
  expect((await state(page)).plant.state).toBe('wobbling');
  expect((await state(page)).chaos.score).toBe(2);
  await until(page, s => s.plant.state === 'tipped');
  const tipped = await state(page);
  expect(tipped.plant).toMatchObject({ damage: 2, events: 2, angle: -80, lastDamage: { objectId: 'plant', kind: 'tip', stage: 2, value: 10 } });
  expect(tipped.chaos).toEqual({ score: 12, damagedObjects: 1, anger: 'calm' });
  expect(tipped.pixel.animation).toBe('idle');
  const screenshot = testInfo.outputPath('plant-tipped.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Gekippter Katzengrastopf und Erde', { path: screenshot, contentType: 'image/png' });
  await page.clock.runFor(1500);
  expect((await state(page)).plant.events).toBe(2);
  expect((await state(page)).chaos.score).toBe(12);
  await reset(page);
  expect((await state(page)).plant).toEqual({ state: 'idle', damage: 0, progress: 0, angle: 0, events: 0, lastDamage: null });
  expect((await state(page)).chaos.score).toBe(0);
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.plant))).toBe(true);
  await besidePlant(page);
  await until(page, s => s.plant.damage === 1);
  expect((await state(page)).chaos.score).toBe(2);
});

test('Katzengras: Springen bricht ab; erneutes Knabbern dupliziert keinen Schaden', async ({ page }) => {
  await start(page);
  await besidePlant(page);
  await until(page, s => s.plant.state === 'nibbling');
  await holdUntil(page, ['Space'], s => !s.pixel.grounded);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await until(page, s => s.pixel.grounded && s.plant.state === 'waiting');
  await page.clock.runFor(1500);
  expect((await state(page)).plant.state).toBe('waiting');
  await until(page, s => s.plant.state === 'nibbling');
  expect((await state(page)).plant.events).toBe(1);
  expect((await state(page)).chaos.score).toBe(2);
  await reset(page);
  await page.clock.runFor(2500);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).plant.events).toBe(0);
});

test('Pixel: bestätigter Idle, Blinzeln und seitlicher Laufzyklus in beiden Richtungen', async ({ page }, testInfo) => {
  await start(page);
  await until(page, s => s.pixel.animation === 'idle' && s.pixel.animationFrame === 0);
  expect((await state(page)).pixel.texture).toBe('pixel');
  await until(page, s => s.pixel.animationFrame === 2);
  await until(page, s => s.pixel.animationFrame === 0);
  await holdUntil(page, ['ArrowRight'], s => s.pixel.animation === 'walk' && s.pixel.x > 145);
  expect((await state(page)).pixel.flipX).toBe(false);
  expect((await state(page)).pixel).toMatchObject({ displayWidth: 64, displayHeight: 64, bodyWidth: 52, bodyHeight: 52 });
  await page.keyboard.down('ArrowRight');
  try {
    const frame = (await state(page)).pixel.animationFrame;
    await until(page, s => s.pixel.animationFrame !== frame);
    const screenshot = testInfo.outputPath('pixel-walking.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach('Pixel läuft im Raum', { path: screenshot, contentType: 'image/png' });
  } finally { await page.keyboard.up('ArrowRight'); }
  await holdUntil(page, ['ArrowLeft'], s => s.pixel.animation === 'walk' && s.pixel.flipX);
  await reset(page);
  expect((await state(page)).pixel.animation).toBe('idle');
});

test('Pixel: Sprung, Scheitelpunkt, Fall, Landung und Klettern in Rückansicht', async ({ page }, testInfo) => {
  await start(page);
  await holdUntil(page, ['Space'], s => s.pixel.animation === 'jump' && !s.pixel.grounded);
  expect((await state(page)).pixel).toMatchObject({ displayWidth: 94, displayHeight: 94, bodyWidth: 52, bodyHeight: 52 });
  await until(page, s => s.pixel.animation === 'apex');
  await until(page, s => s.pixel.animation === 'fall');
  await until(page, s => s.pixel.animation === 'land' && s.pixel.grounded);
  await until(page, s => s.pixel.animation === 'idle');
  await curtain(page);
  await page.keyboard.down('ArrowUp');
  try {
    await until(page, s => s.pixel.animation === 'climb');
    const first = (await state(page)).pixel.animationFrame;
    await until(page, s => s.pixel.animationFrame !== first);
    expect((await state(page)).pixel.flipX).toBe(false);
    expect((await state(page)).pixel).toMatchObject({ displayWidth: 80, displayHeight: 80, bodyWidth: 52, bodyHeight: 52 });
    const screenshot = testInfo.outputPath('pixel-climbing.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach('Pixel klettert in Rückansicht', { path: screenshot, contentType: 'image/png' });
  } finally { await page.keyboard.up('ArrowUp'); }
  await until(page, s => s.pixel.animation === 'slide' && s.pixel.animationFrame === 19);
  await holdUntil(page, ['Space', 'ArrowLeft'], s => s.pixel.animation === 'jump' && !s.pixel.climbing);
});
