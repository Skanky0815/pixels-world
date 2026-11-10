import { test, expect, start, state, until } from './support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';

// eslint-disable-next-line max-lines-per-function -- Die gemeinsame Touch-Konfiguration umfasst genau den vollständigen Sprecherwechseltest.
test.describe('Dialogporträts auf dem Handy', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test(
    'Sprecherwechsel, Blickrichtung und Bildfehler lassen Text und Weiter erreichbar',
    { tag: '@smoke' },
    // eslint-disable-next-line max-lines-per-function -- Echte Eingaben prüfen Heimkehr, Charme und den dekorativen DOM-Bildfallback in einem Ablauf.
    async ({ page }) => {
      await seedRoundRandom(page);
      await start(page, '/?round-profile=fast');
      await useIdleFrames(page);
      await advanceRoundTo(page, (await state(page)).round.returnAtMs);
      await until(
        page,
        (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
        500,
      );
      const portrait = page.locator('.mobile-portrait');

      await expect(portrait).toBeVisible();
      await expect(portrait).toHaveAttribute('data-portrait', 'sara-neutral');
      await expect(portrait).toHaveCSS('transform', 'matrix(-1, 0, 0, 1, 0, 0)');
      expect((await state(page)).sara.portrait).toMatchObject({
        texture: 'sara-neutral',
        flipped: true,
      });
      await portrait.dispatchEvent('error');
      await page.clock.runFor(100);
      await expect(portrait).toBeHidden();
      await expect(page.locator('.mobile-quote')).not.toBeEmpty();
      await page.keyboard.down('Space');
      await until(page, (s) => s.reconciliation.stage === 'reading', 100);
      await page.keyboard.up('Space');
      await expect(portrait).toBeVisible();
      await expect(portrait).toHaveAttribute('data-portrait', 'pixel-neutral');
      await expect(portrait).toHaveCSS('transform', 'none');
      expect((await state(page)).charmDisplay.portrait.texture).toBe('pixel-neutral');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await test
        .info()
        .attach('mobile-portrait', { body: await page.screenshot(), contentType: 'image/png' });
    },
  );
});
