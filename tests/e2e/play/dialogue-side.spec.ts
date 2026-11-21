/* eslint-disable max-lines-per-function -- Beide Eintrittsseiten werden vom echten Rundenende bis zur Versöhnung in Desktop- und Touchansicht geprüft. */
import { test, expect, waitForGame } from '../support/support';
import { observe, move } from './kitchen-support';
import { seedRoundRandom, useIdleFrames } from '../support/round-clock';
import type { Page } from '@playwright/test';
import { fullViewport } from './overlay-support';

for (const view of [
  { name: 'Desktop', mobile: false, width: 1366, height: 900, margin: 24 },
  { name: 'Handy quer', mobile: true, width: 568, height: 320, margin: 8 },
  { name: 'Handy hoch', mobile: true, width: 390, height: 844, margin: 12 },
  { name: 'Tablet', mobile: true, width: 1024, height: 768, margin: 12 },
  { name: 'Tablet quadratisch', mobile: true, width: 768, height: 768, margin: 12 },
])
  for (const [room, side] of [
    ['living-room', 'right'],
    ['kitchen', 'left'],
  ] as const)
    test.describe(`Dialog ${room} ${view.name}`, () => {
      test.use({
        hasTouch: view.mobile,
        isMobile: view.mobile,
        viewport: { width: view.width, height: view.height },
      });
      test('Textbox liegt gegenüber Sara und bleibt beim Übergang zur Versöhnung dort @smoke', async ({
        page,
      }) => {
        await seedRoundRandom(page);
        await page.goto(`/play.html?room=${room}&round-profile=fast`);
        await waitForGame(page);
        await expect(page.locator('.start-screen')).toHaveAttribute(
          'data-dialogue-side',
          side === 'left' ? 'right' : 'left',
        );
        await test.info().attach(`Einführung-${room}-${view.name}`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
        await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
        await useIdleFrames(page);
        await page.clock.runFor((await observe(page)).round.returnAtMs);
        await expect
          .poll(
            async () => {
              await page.clock.runFor(250);
              const s = await observe(page);

              return s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated';
            },
            { intervals: [0], timeout: 15000 },
          )
          .toBe(true);
        await assertSide(page, side, view.margin);
        const s = await observe(page);

        if (view.width === view.height) expect(s.camera.zoom).toBe(1.35);
        expect(
          side === 'left'
            ? s.sara.dialogueBounds.left > s.sara.x
            : s.sara.dialogueBounds.right < s.sara.x,
        ).toBe(true);
        await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
        await assertSide(page, side, view.margin);
        await test.info().attach(`Dialog-${room}-${view.name}`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
        await page.locator('.mobile-hint').scrollIntoViewIfNeeded();
        await expect(page.locator('.mobile-hint')).toBeInViewport({ ratio: 1 });
      });
    });

async function assertSide(page: Page, side: 'left' | 'right', margin: number) {
  await fullViewport(page);
  const panel = page.locator('.mobile-dialogue');
  const card = (await panel.boundingBox())!;
  const canvas = (await page.locator('canvas').boundingBox())!;
  const host = await panel.evaluate((el) => {
    const parent = (el as HTMLElement).offsetParent as HTMLElement;
    const bounds = parent.getBoundingClientRect();

    return {
      left: bounds.left + parent.clientLeft,
      right: bounds.left + parent.clientLeft + parent.clientWidth,
    };
  });

  await expect(panel).toHaveAttribute('data-entry-side', side);
  await expect(panel).toHaveAttribute('data-dialogue-side', side === 'left' ? 'right' : 'left');
  await expect(panel).toHaveClass(/dialogue-box/);
  await expect(panel).toHaveCSS('border-radius', '0px');
  await expect(panel).toHaveCSS('border-top-width', '2px');
  const menu = (await page.locator('.game-menu-actions').boundingBox())!;

  expect(
    card.x + card.width <= menu.x ||
      menu.x + menu.width <= card.x ||
      card.y >= menu.y + menu.height ||
      menu.y >= card.y + card.height,
  ).toBe(true);
  await expect(panel).toBeInViewport({ ratio: 1 });
  expect(side === 'left' ? host.right - card.x - card.width : card.x - host.left).toBeCloseTo(
    margin,
    0,
  );

  if (canvas.width >= canvas.height)
    expect(
      side === 'left'
        ? card.x > canvas.x + canvas.width / 2
        : card.x + card.width < canvas.x + canvas.width / 2,
    ).toBe(true);

  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
}
