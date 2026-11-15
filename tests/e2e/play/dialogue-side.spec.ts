/* eslint-disable max-lines-per-function -- Beide Eintrittsseiten werden vom echten Rundenende bis zur Versöhnung in Desktop- und Touchansicht geprüft. */
import { test, expect, waitForGame } from '../support/support';
import { observe, move } from './kitchen-support';
import { seedRoundRandom, useIdleFrames } from '../support/round-clock';
import type { Page } from '@playwright/test';

for (const mobile of [false, true])
  for (const [room, side] of [
    ['living-room', 'right'],
    ['kitchen', 'left'],
  ] as const)
    test.describe(`Dialog ${room} ${mobile ? 'Touch' : 'Desktop'}`, () => {
      test.use({
        hasTouch: mobile,
        isMobile: mobile,
        viewport: mobile ? { width: 568, height: 320 } : { width: 1366, height: 900 },
      });
      test('Textbox liegt gegenüber Sara und bleibt beim Übergang zur Versöhnung dort @smoke', async ({
        page,
      }) => {
        await seedRoundRandom(page);
        await page.goto(`/play.html?room=${room}&round-profile=fast`);
        await waitForGame(page);
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
        await assertSide(page, side, mobile ? 8 : 24);
        const s = await observe(page);

        expect(
          side === 'left'
            ? s.sara.dialogueBounds.left > s.sara.x
            : s.sara.dialogueBounds.right < s.sara.x,
        ).toBe(true);
        await move(page, ['Space'], (s) => s.reconciliation.stage === 'reading');
        await assertSide(page, side, mobile ? 8 : 24);
        await test.info().attach(`Dialog-${room}-${mobile ? 'Handy' : 'Desktop'}`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      });
    });

async function assertSide(page: Page, side: 'left' | 'right', margin: number) {
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
  await expect(panel).toBeInViewport({ ratio: 1 });
  expect(side === 'left' ? host.right - card.x - card.width : card.x - host.left).toBeCloseTo(
    margin,
    0,
  );
  expect(
    side === 'left'
      ? card.x > canvas.x + canvas.width / 2
      : card.x + card.width < canvas.x + canvas.width / 2,
  ).toBe(true);
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
}
