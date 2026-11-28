import { openAlbum } from '../support/pause-support';
import { test, expect, waitForGame, until } from '../support/support';
import type { Page } from '@playwright/test';

for (const viewport of [
  { width: 1280, height: 900, touch: false },
  { width: 390, height: 844, touch: true },
  { width: 844, height: 390, touch: true },
  { width: 320, height: 400, touch: true },
  { width: 568, height: 320, touch: true },
]) {
  // eslint-disable-next-line max-lines-per-function -- Die fünf Gerätevarianten teilen denselben vollständigen Ansichtswechsel.
  test.describe(`Application Shell ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.touch, isMobile: viewport.touch });
    // eslint-disable-next-line max-lines-per-function -- Dieselben DOM-Knoten werden durch vier echte Ansichten und zurück verfolgt.
    test('Menü, Levelwahl, Album und Spiel teilen denselben Rahmen @smoke', async ({ page }) => {
      await page.goto('/play.html');
      await waitForGame(page, false);
      const chrome = await page.locator('main > header').evaluateHandle((header) => ({
        header,
        footer: document.querySelector('main > footer'),
      }));

      await expect(page.locator('#game-content > .game-menu')).toBeVisible();
      await shellFrame(page);
      await panelFillsContent(page, '.game-menu');
      await page.screenshot({ path: `test-results/shell-${viewport.width}-menu.png` });
      await page.locator('[data-menu-play]').click();
      await expect(page.locator('#game-content > .room-selection')).toBeVisible();
      await shellFrame(page);
      await panelFillsContent(page, '.room-selection');
      await page.screenshot({ path: `test-results/shell-${viewport.width}-rooms.png` });
      await openAlbum(page);
      const album = page.locator('#game-content > .album-screen');

      await expect(album).toBeVisible();
      await expect(album).toHaveAttribute('role', 'region');
      await expect(album.locator('[data-action="close"]')).toHaveCount(0);
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      await shellFrame(page);
      await panelFillsContent(page, '.album-screen');
      await expect(page.locator('.room-selection')).toBeHidden();
      await scrollAlbum(page);
      await page.locator('main > header .pause-toggle').click();
      await expect(album).toBeHidden();
      await expect(page.locator('.game-menu')).toBeVisible();
      await page.locator('[data-pause-resume]').click();
      await expect(page.locator('.room-selection')).toBeVisible();
      await openAlbum(page);
      await page.screenshot({ path: `test-results/shell-${viewport.width}-album.png` });
      await page.keyboard.press('Escape');
      await page.locator('[data-pause-resume]').click();
      await page.locator('[data-room-start]').click();
      await page.locator('#game').focus();
      await page.keyboard.down('Space');
      await until(page, (state) => state.started);
      await page.keyboard.up('Space');
      await shellFrame(page);
      const game = await page.locator('#game').boundingBox();
      const footer = await page.locator('main > footer').boundingBox();

      expect(game!.height).toBeGreaterThan(120);
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(viewport.height + 1);
      await page.screenshot({ path: `test-results/shell-${viewport.width}-play.png` });
      expect(
        await chrome.evaluate(
          ({ header, footer }) =>
            header === document.querySelector('main > header') &&
            footer === document.querySelector('main > footer'),
        ),
      ).toBe(true);
      await expect(page.locator('main > header')).toHaveCount(1);
      await expect(page.locator('main > footer')).toHaveCount(1);
    });

    test('Lange Optionen scrollen innerhalb der ausgefüllten Inhaltsfläche @smoke', async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Langes Optionsmenü und echte Scroll-Eingabe prüfen den unveränderten gemeinsamen Rahmen.
    }) => {
      await page.goto('/play.html');
      await waitForGame(page, false);
      await page.locator('[data-menu-settings]').click();
      await panelFillsContent(page, '.game-menu');
      const chrome = await frameBounds(page);
      const menu = page.locator('.game-menu');

      if (viewport.height <= 550) {
        expect(await menu.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
        await menu.hover();
        await page.mouse.wheel(0, 2000);
        await expect
          .poll(async () => {
            await page.clock.runFor(32);

            return menu.evaluate((node) => node.scrollTop);
          })
          .toBeGreaterThan(0);
      }

      await shellFrame(page);
      expect(await frameBounds(page)).toEqual(chrome);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await page.screenshot({ path: `test-results/shell-${viewport.width}-options.png` });
    });
  });
}

function frameBounds(page: Page) {
  return page.locator('main > header, main > footer').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();

      return { top: box.top, bottom: box.bottom };
    }),
  );
}

async function panelFillsContent(page: Page, selector: string) {
  const content = (await page.locator('#game-content').boundingBox())!;
  const panel = (await page.locator(selector).boundingBox())!;

  expect(panel.y).toBeCloseTo(content.y, 0);
  expect(panel.y + panel.height).toBeCloseTo(content.y + content.height, 0);
}

// eslint-disable-next-line max-lines-per-function -- Geometrie und Sichtbarkeit bilden gemeinsam den Rahmenvertrag.
async function shellFrame(page: Page) {
  const header = page.locator('main > header');
  const footer = page.locator('main > footer');
  const content = page.locator('#game-content');

  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();
  const bounds = await Promise.all([
    header.boundingBox(),
    content.boundingBox(),
    footer.boundingBox(),
  ]);
  const [top, middle, bottom] = bounds;

  expect(top && middle && bottom).toBeTruthy();
  expect(top!.y + top!.height).toBeLessThanOrEqual(middle!.y + 1);
  expect(middle!.y + middle!.height).toBeLessThanOrEqual(bottom!.y + 1);
  expect(middle!.height).toBeGreaterThan(0);
  expect(top!.y).toBeGreaterThanOrEqual(0);
  expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
}

// eslint-disable-next-line max-lines-per-function -- Breites flaches Vergleichsfenster muss Rahmen und vollständigen Raum gleichzeitig zeigen.
test('Klassische Ansicht bleibt bei1920×600 innerhalb der Shell @smoke', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 600 });
  await page.goto('/play.html?camera=room');
  await waitForGame(page);
  await page.keyboard.down('Space');
  await until(page, (state) => state.started);
  await page.keyboard.up('Space');
  await shellFrame(page);
  const content = (await page.locator('#game-content').boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;

  expect(canvas.y).toBeGreaterThanOrEqual(content.y);
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(content.y + content.height + 1);
  expect(canvas.width / canvas.height).toBeCloseTo(16 / 9, 2);
  await page.screenshot({ path: 'test-results/shell-1920-classic.png' });
});

// eslint-disable-next-line max-lines-per-function -- Echte Scroll-Eingabe und unveränderte Rahmengeometrie bilden gemeinsam den Ansichtsvertrag.
async function scrollAlbum(page: Page) {
  const album = page.locator('.album-screen');
  const chrome = await frameBounds(page);

  if (await album.evaluate((node) => node.scrollHeight > node.clientHeight + 1)) {
    await album.hover();
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(async () => {
        await page.clock.runFor(32);

        return album.evaluate((node) => node.scrollTop);
      })
      .toBeGreaterThan(0);
  }

  expect(await frameBounds(page)).toEqual(chrome);
  expect(await page.evaluate(() => scrollY)).toBe(0);
}
