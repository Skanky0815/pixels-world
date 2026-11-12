import { changeLanguage } from './pause-support';
import { test, expect, loadIntro, start, state, until } from './support';
import { startTouch } from './touch-support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from './round-clock';

test('Sprachwahl: Einführung, Persistenz und laufende Runde ohne Reset', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Sprache wird über echte Einstellungen gewechselt; Zustand und gespeicherte Auswahl werden gemeinsam geprüft.
}) => {
  await loadIntro(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('.start-copy')).toContainText('Finde seinen Lieblingsball');
  await expect(page.locator('.start-copy')).not.toContainText('oben rechts');
  await changeLanguage(page, 'en');
  await expect(page.locator('.start-copy h2')).toHaveText('Ready, Pixel?');
  await expect(page.locator('.start-copy')).toContainText('Find his favourite ball');
  await expect(page.locator('.start-copy')).not.toContainText('top right');
  await loadIntro(page);
  await expect(page.locator('[data-language="en"]')).toHaveAttribute('aria-pressed', 'true');
  await start(page);
  const before = await state(page);

  await changeLanguage(page, 'de');
  expect((await state(page)).generation).toBe(before.generation);
  expect((await state(page)).round.returnAtMs).toBe(before.round.returnAtMs);
  expect((await state(page)).chaos.score).toBe(before.chaos.score);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('Gesperrter Sprachspeicher verhindert weder Start noch Sprachwechsel', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Browser verweigert Speicherzugriff; der Sprachwechsel muss trotzdem ohne Fehler funktionieren.
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('blocked');
    };

    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await loadIntro(page);
  await changeLanguage(page, 'en');
  await expect(page.locator('.start-copy h2')).toHaveText('Ready, Pixel?');
  await loadIntro(page);
  await expect(page.locator('[data-language="de"]')).toHaveAttribute('aria-pressed', 'true');
});

// eslint-disable-next-line max-lines-per-function -- Die deklarative Gerätegruppe hält den vollständigen Touch-Ablauf unter derselben Browserkonfiguration.
test.describe('Lokalisierte Touch-Runde', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

  test('Englische Dialoge, Versöhnung und Ergebnis mit Sprachwechsel während der Runde', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Gesamter Spielablauf mit Touch, Sprachwechsel und unveränderten Eingaberegeln.
  }) => {
    await seedRoundRandom(page);
    const touch = await startTouch(page, '/?round-profile=fast');

    await changeLanguage(page, 'en');
    await expect(page.locator('[data-control="jump"]')).toHaveText('Jump');
    await expect(page.locator('.mobile-hud')).toContainText('CHAOS: 0');
    await expect(page.locator('.mobile-hud')).not.toContainText(/MOOD|time|soon/i);
    await expect(page.locator('.mobile-goal')).toHaveCount(0);
    await useIdleFrames(page);
    await advanceRoundTo(page, (await state(page)).round.returnAtMs);
    await until(
      page,
      (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
      500,
    );
    const before = await state(page);

    await changeLanguage(page, 'de');
    await changeLanguage(page, 'en');
    expect((await state(page)).generation).toBe(before.generation);
    expect((await state(page)).homecoming.selection).toEqual(before.homecoming.selection);
    await expect(page.locator('.mobile-hint')).toContainText('Continue');
    await touch.tap('jump');
    await until(page, (s) => s.reconciliation.stage === 'reading', 100);
    await expect(page.locator('.mobile-dialogue')).toContainText('CHARM OFFENSIVE');
    await expect(page.locator('.mobile-dialogue')).not.toContainText(/attempts/i);
    const initial = (await state(page)).reconciliation;

    await changeLanguage(page, 'de');
    await changeLanguage(page, 'en');
    await touch.tap('jump');

    for (let heart = 0; heart < initial.required; heart++) {
      for (let index = 0; index < initial.length; index++) {
        await until(page, (s) => s.reconciliation.stage === 'input', 100);
        const direction = (await state(page)).reconciliation.expected;

        if (direction) await touch.tap(direction);
        await page.clock.runFor(100);
      }

      if ((await state(page)).reconciliation.stage === 'feedback') await touch.tap('jump');
    }

    await until(page, (s) => s.reconciliation.stage === 'complete', 100);
    await expect(page.locator('.mobile-dialogue')).toContainText('ROUND RESULT');
    await expect(page.locator('.mobile-dialogue')).not.toContainText(/Main goal|Difficulty/i);
    await expect(page.locator('.result-headline')).toHaveText('Friends again!');
    await expect(page.locator('.result-hearts')).toHaveAttribute('aria-label', '1 of 1 hearts');
    await expect(page.locator('[data-control="reset"]')).toHaveText('New round');
    expect((await state(page)).reconciliation.failures).toBe(0);
    await test.info().attach('english-mobile-result', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
