import { test as base, expect, type Page } from '@playwright/test';

import type { GameTestState } from '../../src/test-state';

type RoomTestState = GameTestState & {
  couch: NonNullable<GameTestState['couch']>;
  curtain: NonNullable<GameTestState['curtain']>;
  plant: NonNullable<GameTestState['plant']>;
};

const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'r'];

const test = base.extend<{ healthyBrowser: void }>({
  healthyBrowser: [
    // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
    async ({ page }, use) => {
      const clockStart = new Date('2026-01-01T00:00:00Z');

      await page.clock.install({ time: clockStart });
      await page.clock.pauseAt(new Date(clockStart.getTime() + 1000));
      const failures: string[] = [];

      page.on('pageerror', (error) => failures.push(error.message));
      page.on('requestfailed', (request) =>
        failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`),
      );
      page.on('response', (response) => {
        if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
      });

      try {
        await use();
      } finally {
        if (!page.isClosed()) for (const key of keys) await page.keyboard.up(key);
        expect(failures, 'Keine Browserfehler oder fehlgeschlagenen Ressourcen').toEqual([]);
      }
    },
    { auto: true },
  ],
});

async function state(page: Page): Promise<RoomTestState> {
  return page.evaluate(() => {
    const snapshot = window.__pixelTest;

    if (!snapshot || !snapshot.couch || !snapshot.curtain || !snapshot.plant)
      throw new Error('Testzustand fehlt');

    // The two authored fixtures contain these objects; the general observer allows rooms without them.
    return { ...snapshot, couch: snapshot.couch, curtain: snapshot.curtain, plant: snapshot.plant };
  });
}

async function loadIntro(page: Page, path = '/') {
  await page.goto(path.replace(/^\/(?=\?|$)/, '/play.html'));
  await waitForGame(page);
}

// eslint-disable-next-line max-lines-per-function -- Dieselbe schreibgeschützte Bereitschaftsgrenze gilt für direkte Spielaufrufe und Navigation aus der Landingpage.
async function waitForGame(page: Page) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return page.evaluate(() => window.__pixelTest?.ready);
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('#game').focus();
}

async function start(page: Page, path = '/') {
  await loadIntro(page, path);
  await page.keyboard.down('Space');
  await until(page, (s) => s.started);
  await page.keyboard.up('Space');
  await until(page, (s) => s.pixel.grounded);
}

// eslint-disable-next-line max-lines-per-function -- Gemeinsame Clock-Polling-Grenze liefert bei Fehlern den vollständigen unveränderlichen Snapshot.
async function until(page: Page, check: (s: RoomTestState) => boolean, stepMs = 32) {
  await expect
    .poll(
      async () => {
        // Real keyboard input, deterministic simulation steps: runner latency must not hold a key longer.
        await page.clock.runFor(stepMs);
        const snapshot = await state(page);

        return check(snapshot) ? { matched: true } : { matched: false, snapshot };
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toMatchObject({ matched: true });
}

async function holdUntil(page: Page, held: string[], check: (s: RoomTestState) => boolean) {
  try {
    for (const key of held) await page.keyboard.down(key);
    await until(page, check);
  } finally {
    for (const key of held) await page.keyboard.up(key);
  }
}

async function couch(page: Page) {
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 265);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
}

async function curtain(page: Page) {
  // Walk under the furniture, using only real input to reach the curtain.
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 790);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.climbing && s.pixel.y < 350);
}

async function framesPass(page: Page, count = 15) {
  const frame = (await state(page)).frame;

  await until(page, (s) => s.frame >= frame + count);
}

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
async function reset(page: Page) {
  const generation = (await state(page)).generation;

  await holdUntil(
    page,
    ['r'],
    (s) => s.generation > generation && Math.abs(s.pixel.x - 110) < 2 && !s.pixel.climbing,
  );
  await until(
    page,
    (s) => s.pixel.grounded && Math.abs(s.pixel.x - 110) < 2 && Math.abs(s.pixel.bottom - 468) < 2,
  );
  const { pixel } = await state(page);

  expect(pixel.climbing).toBe(false);
  expect(pixel.gravity).toBe(true);
  expect(pixel.velocityX).toBe(0);
  expect(pixel.velocityY).toBe(0);
}

async function lowerShelf(page: Page) {
  await couch(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 410);
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 480);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
}

async function firstVase(page: Page) {
  await lowerShelf(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.vases[0].state !== 'resting');
}

async function besideCouch(page: Page) {
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 185);
  await until(page, (s) => s.pixel.velocityX === 0 && s.couch.state === 'waiting');
}

async function besidePlant(page: Page) {
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 103);
  await until(page, (s) => s.pixel.velocityX === 0 && s.plant.state === 'waiting');
}

export {
  test,
  expect,
  state,
  start,
  loadIntro,
  waitForGame,
  until,
  holdUntil,
  couch,
  curtain,
  framesPass,
  reset,
  besideCouch,
  besidePlant,
  firstVase,
  lowerShelf,
};
