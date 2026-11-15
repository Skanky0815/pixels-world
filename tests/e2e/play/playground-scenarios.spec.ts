/* eslint-disable max-lines-per-function -- Reale Szenariowechsel, Eingaben und die zugehörigen Diagnosewerte bleiben als vollständige Abläufe zusammen. */
import { test, expect, waitForLoadingScreen } from '../support/support';
import {
  snapshot,
  untilPlayground,
  waitForDevReady,
  movePlayground,
  type Snapshot,
} from './playground-support';
import { LAB_ROOMS } from '../../../game/play/content/rooms/index';
import { TouchDriver } from '../support/touch-support';
import type { Page } from '@playwright/test';

const fridge = (state: Snapshot) => state.shelves.find((shelf) => shelf.isFridge)!.fridge!;

async function loadScenario(page: Page, id = 'fridge-incoming') {
  await page.goto(`http://127.0.0.1:4176/interactable-playground.html?scenario=${id}`);
  await waitForDevReady(page, 'data-playground-ready');
  await page.locator('#game').focus();
  await untilPlayground(page, (s) => s.pixel.grounded);
}

function jarX(state: Snapshot) {
  const jar = state.objects.find((object) => object.id === 'source-jar')?.state;

  if (!jar || !('x' in jar)) throw new Error('Quellglas fehlt in der Szenariodiagnose');

  return jar.x;
}

test('Spielwiese: echtes Glas trifft den Kühlschrank; Diagnose, Besuch und Reset funktionieren', async ({
  page,
}) => {
  await loadScenario(page);
  const initial = await snapshot(page);

  expect(initial.room).toEqual({ id: 'fridge-incoming', width: 1320, height: 540 });
  await expect(page.locator('#game canvas')).toHaveAttribute('width', '1320');
  await expect(page.getByLabel('Testart')).toHaveValue('scenario');
  await expect(page.getByLabel('Szenario aus dem Testkatalog')).toHaveValue('fridge-incoming');
  await expect(page.getByLabel('Diagnoseziel')).toHaveValue('shelf:kitchen-fridge');
  await expect(page.locator('#playground-state')).toHaveText('idle');
  await movePlayground(page, ['ArrowRight'], (s) => jarX(s) > 1018);
  await untilPlayground(page, (s) => fridge(s).events === 1);
  const hit = await snapshot(page);

  expect(fridge(hit)).toMatchObject({
    state: 'idle',
    doorState: 'closed',
    captured: false,
    events: 1,
  });
  expect(hit.pixel.visible).toBe(true);
  await expect(page.locator('#playground-state')).toHaveText('idle');
  await page.getByLabel('Diagnoseziel').selectOption('object:source-jar');
  await expect(page.locator('#playground-kind')).toContainText('source-jar');
  expect((await snapshot(page)).generation).toBe(initial.generation);
  await page.getByLabel('Diagnoseziel').selectOption('shelf:kitchen-fridge');
  await expect(page.locator('#playground-kind')).toContainText('Kühlschrank');
  await page.locator('#game').focus();
  await movePlayground(page, ['ArrowLeft'], (s) => s.pixel.x <= 870);
  await untilPlayground(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 258) < 2);
  await movePlayground(page, ['ArrowRight'], (s) => s.pixel.x >= 1008);
  await untilPlayground(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 468) < 2);
  const settled = await snapshot(page);

  await movePlayground(page, ['Space', 'ArrowRight'], (s) => fridge(s).captured);
  await untilPlayground(page, (s) => fridge(s).state === 'open');
  const visited = await snapshot(page);

  expect(visited.score).toBe(settled.score);
  expect(visited.events.filter((event) => event.objectId === 'kitchen-fridge')).toHaveLength(1);
  expect(visited.pixel.visible).toBe(true);
  await expect(page.locator('#playground-state')).toHaveText('open');
  await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
  await untilPlayground(page, (s) => s.generation > initial.generation && s.pixel.grounded);
  const reset = await snapshot(page);

  expect(reset).toMatchObject({ score: 0, events: [], pixel: { x: 930 } });
  expect(fridge(reset)).toMatchObject({ state: 'idle', events: 0, hidden: false });
  expect(reset.resources).toEqual(initial.resources);
});

test('Spielwiese: Szenariokatalog, echte Weltgrößen und wiederholte Wechsel räumen Ressourcen auf', async ({
  page,
}) => {
  await loadScenario(page);
  expect(
    await page
      .locator('#playground-object option')
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
  ).toEqual(Object.keys(LAB_ROOMS));
  const resources = new Map<string, Snapshot['resources']>();

  for (let cycle = 0; cycle < 2; cycle++) {
    for (const id of ['fridge-visit', 'impact-vases', 'fridge-incoming']) {
      const before = (await snapshot(page)).generation;

      await page.getByLabel('Szenario aus dem Testkatalog').selectOption(id);
      await untilPlayground(
        page,
        (s) => s.variant === id && s.generation > before && s.pixel.grounded,
      );
      const next = await snapshot(page);

      expect(next.score).toBe(0);
      expect(next.events).toEqual([]);
      expect(next.room.width).toBe(LAB_ROOMS[id as keyof typeof LAB_ROOMS].width);
      await expect(page.locator('canvas')).toHaveCount(1);
      await expect(page.locator('.touch-controls')).toHaveCount(1);

      if (resources.has(id)) expect(next.resources).toEqual(resources.get(id));
      resources.set(id, next.resources);
    }
  }

  await page.getByLabel('Testart').selectOption('object');
  await untilPlayground(page, (s) => s.mode === 'object' && s.room.width === 800);
  const objectCanvas = await page.locator('#game canvas').boundingBox();
  const objectHost = await page.locator('#game').boundingBox();

  expect(objectCanvas!.width).toBeCloseTo(objectHost!.width, 0);
  expect(objectCanvas!.height).toBeCloseTo(objectHost!.height, 0);
  await expect(page.getByLabel('Objekt / Variante aus dem Spielkatalog')).toHaveValue('cozy-couch');
  await expect(page.locator('#playground-round')).toBeHidden();
  await page.getByLabel('Testart').selectOption('scenario');
  await untilPlayground(page, (s) => s.mode === 'scenario' && s.variant === 'fridge-incoming');
  await expect(page).toHaveURL(/\?scenario=fridge-incoming$/);
});

test('Spielwiese: gewähltes Szenario öffnet den echten Rundenablauf; unbekannte URLs bleiben bedienbar', async ({
  page,
}) => {
  await loadScenario(page, 'toString');
  await expect(page.locator('#playground-notice')).toContainText('Unbekannte Playground-Auswahl');
  await expect(page.getByLabel('Testart')).toHaveValue('object');
  await page.getByLabel('Testart').selectOption('scenario');
  await untilPlayground(page, (s) => s.mode === 'scenario');
  await expect(page.locator('#playground-notice')).toBeHidden();
  const link = page.getByRole('link', { name: 'Mit vollständiger Runde im Spiel testen' });

  await expect(link).toHaveAttribute('href', '/play.html?room=fridge-incoming&camera=room');
  await link.click();
  await expect(page).toHaveURL(/\/play.html\?room=fridge-incoming&camera=room$/);
  await waitForLoadingScreen(page);
  await expect(page.getByRole('heading', { name: 'Bereit, Pixel?' })).toBeVisible();
  await expect(page.locator('#game')).toHaveAttribute('data-room-width', '1320');
});

test('Spielwiese: große Szenarien passen in das kompakte Desktop- und Handylayout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadScenario(page);
  await page.getByText('Objekt, Pixel und Ressourcen im Detail').click();
  const stage = await page.locator('#game').boundingBox();
  const canvas = await page.locator('#game canvas').boundingBox();
  const panel = await page.locator('.playground-readout').boundingBox();

  expect(stage!.width).toBe(800);
  expect(canvas!.width).toBeCloseTo(stage!.width, 0);
  expect(canvas!.height).toBeCloseTo(stage!.height, 0);
  expect(panel!.x).toBeGreaterThan(stage!.x + stage!.width);
  expect(stage!.width / stage!.height).toBeCloseTo(1320 / 540, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => {
      await page.clock.runFor(32);
      const host = await page.locator('#game').boundingBox();
      const fitted = await page.locator('#game canvas').boundingBox();

      return Math.abs(fitted!.width - host!.width);
    })
    .toBeLessThan(0.5);
  const mobileStage = await page.locator('#game').boundingBox();
  const mobileCanvas = await page.locator('#game canvas').boundingBox();
  const mobilePanel = await page.locator('.playground-readout').boundingBox();

  expect(mobilePanel!.y).toBeGreaterThan(mobileStage!.y + mobileStage!.height);
  expect(mobileCanvas!.width).toBeCloseTo(mobileStage!.width, 0);
  expect(mobileCanvas!.height).toBeCloseTo(mobileStage!.height, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByLabel('Testart')).toBeVisible();
  await expect(page.getByLabel('Szenario aus dem Testkatalog')).toBeVisible();
  await expect(page.getByLabel('Diagnoseziel')).toBeVisible();
});

test.describe('Große Playground-Szenarien mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Glas schieben und Reset funktionieren bei unverkleinerter Weltphysik', async ({ page }) => {
    await loadScenario(page);
    const touch = await TouchDriver.create(page);
    const initial = await snapshot(page);

    await expect(page.locator('.touch-controls')).toBeVisible();
    await touch.press('right');
    await untilPlayground(page, (s) => jarX(s) > 1018);
    await touch.lift();
    await untilPlayground(page, (s) => fridge(s).events === 1);
    expect(fridge(await snapshot(page))).toMatchObject({ doorState: 'closed', captured: false });
    await page.getByRole('button', { name: 'Szene zurücksetzen' }).tap();
    await untilPlayground(page, (s) => s.generation > initial.generation && s.pixel.grounded);
    expect((await snapshot(page)).resources).toEqual(initial.resources);
    expect((await snapshot(page)).score).toBe(0);
    await expect(page.locator('[data-control=right]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.touch-controls')).toHaveCount(1);
  });
});
