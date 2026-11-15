import { playgroundRecipe, importPlaygroundRecipe } from './playground-recipe-support';
/* eslint-disable max-lines-per-function -- Öffentliche Eingaben und losgelöste DOM-Befunde bilden die gemeinsame Objekt-Testgrenze. */
import { test, expect } from '../support/support';
import type { Page } from '@playwright/test';
import { snapshot, untilPlayground, waitForDevReady, type Snapshot } from './playground-support';
import { TouchDriver } from '../support/touch-support';

export type ObjectState = Snapshot;
const paused = new WeakSet<Page>();

async function loadScenario(page: Page, id: string, search = '') {
  const recipe = playgroundRecipe(id);

  await page.goto(
    `http://127.0.0.1:4176/interactable-playground.html?scenario=${recipe ? 'empty' : id}${search}`,
  );
  await waitForDevReady(page, 'data-playground-ready');
  await page.locator('#game').focus();
  await untilPlayground(page, (s) => s.pixel.grounded);

  if (recipe) await importPlaygroundRecipe(page, id);
}

async function start(page: Page, path = '/') {
  const params = new URL(path, 'http://localhost').searchParams;
  const id = params.get('scenario') ?? 'living-room';

  params.delete('scenario');
  await loadScenario(page, id, params.size ? `&${params}` : '');
}

async function startTouch(page: Page, path = '/') {
  await start(page, path);

  return TouchDriver.create(page);
}

async function resume(page: Page) {
  paused.delete(page);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

async function togglePause(page: Page) {
  if (paused.has(page)) return resume(page);
  paused.add(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
}

async function reset(page: Page) {
  const generation = (await snapshot(page)).generation;

  await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
  await untilPlayground(page, (s) => s.generation > generation && s.pixel.grounded);
}

const move = holdUntil;
const state = snapshot;
const observe = snapshot;

async function until(page: Page, check: (s: ObjectState) => boolean, _stepMs = 32) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(_stepMs);

        return check(await snapshot(page));
      },
      { intervals: [0], timeout: 15000 },
    )
    .toBe(true);
}

async function holdUntil(page: Page, held: string[], check: (s: ObjectState) => boolean) {
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

async function lowerShelf(page: Page) {
  await couch(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 410);
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 480);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
}

async function middleShelf(page: Page) {
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 790);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.climbing && s.pixel.y <= 220);
  await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 730);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.pixel.grounded && s.pixel.bottom === 224);
}

async function firstVase(page: Page) {
  await lowerShelf(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.vases[0].state !== 'resting');
}

async function besideCouch(page: Page) {
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 185);
  await until(page, (s) => s.pixel.velocityX === 0 && s.couch!.state === 'waiting');
}

async function besidePlant(page: Page) {
  const before = await state(page);
  const right = before.pixel.x < before.plant!.x;
  const target = before.plant!.x + (right ? 0 : 18);

  await holdUntil(page, [right ? 'ArrowRight' : 'ArrowLeft'], (s) =>
    right ? s.pixel.x >= target : s.pixel.x <= target,
  );
  await until(page, (s) => s.pixel.velocityX === 0 && s.plant!.state === 'waiting');
}

async function framesPass(page: Page, count = 15) {
  const frame = (await state(page)).frame;

  await until(page, (s) => s.frame >= frame + count);
}

async function climbToTableLanding(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 255);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 398) < 2);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 410);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 328) < 2);
}

async function climbFromTableToFridge(page: Page) {
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 581);
  await move(page, ['ArrowUp'], (s) => s.pixel.bottom <= 170);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 688);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 148) < 2);
}

async function climbToCounterLanding(page: Page) {
  await climbToTableLanding(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 450);
  const snapshot = await observe(page);
  const hasFridge = snapshot.room.width === 960 && snapshot.shelves.some((shelf) => shelf.isFridge);

  if (hasFridge) {
    await climbFromTableToFridge(page);
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 830);
  } else await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 675);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
}

async function climbToCounter(page: Page) {
  await climbToCounterLanding(page);

  if ((await observe(page)).pixel.x < 800) {
    await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 800);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
  }

  const x = (await observe(page)).pixel.x;

  await move(page, [x < 860 ? 'ArrowRight' : 'ArrowLeft'], (s) => Math.abs(s.pixel.x - 860) < 4);
}

export {
  test,
  expect,
  state,
  observe,
  start,
  startTouch,
  loadScenario,
  until,
  holdUntil,
  holdUntil as move,
  reset,
  togglePause,
  resume,
  couch,
  curtain,
  lowerShelf,
  middleShelf,
  firstVase,
  besideCouch,
  besidePlant,
  framesPass,
  climbToTableLanding,
  climbFromTableToFridge,
  climbToCounterLanding,
  climbToCounter,
};
