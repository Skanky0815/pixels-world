import { introAction, test, expect, loadIntro } from './support';

const descriptions = {
  de: [
    'Mehr Zeit, weniger Chaosobjekte, leichtere Versöhnung und deutliche Zielhilfe.',
    'Ausgewogenes Balancing mit dezenter Zielhilfe.',
    'Weniger Zeit, mehr Chaosobjekte, instabilere Regale, schwierigere Versöhnung und keine Zielmarkierung.',
  ],
  en: [
    'More time, fewer objects to cause chaos, easier reconciliation and a clear goal hint.',
    'Balanced gameplay with a subtle goal hint.',
    'Less time, more objects to cause chaos, less stable shelves, harder reconciliation and no goal marker.',
  ],
};

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  // eslint-disable-next-line max-lines-per-function -- Die Gerätevariante hält den vollständigen Vergleich von Sprache, Erklärung und Auswahl zusammen.
  test.describe(`Schwierigkeitserklärungen ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.width !== 1280, isMobile: viewport.width !== 1280 });
    test('Nur der gewählte Grad wird erklärt; Auswahl und Sprache aktualisieren die Hilfe', async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Die Gerätevariante hält den vollständigen Vergleich von Sprache, Erklärung und Auswahl zusammen.
    }, testInfo) => {
      await loadIntro(page);
      await (await introAction(page, 'options')).click();
      const help = page.locator('#difficulty-help');
      const select = page.locator('[data-difficulty]');

      await expect(select).toHaveAttribute(
        'aria-describedby',
        'difficulty-help difficulty-current',
      );

      await expect(help).toHaveAttribute('aria-live', 'polite');
      await expect(help).toHaveText(descriptions.de[1]);

      for (const language of ['de', 'en'] as const) {
        await page.locator(`[data-language="${language}"]`).click();
        const current = ['easy', 'normal', 'hard'].indexOf(await select.inputValue());

        await expect(help).toHaveText(descriptions[language][current]);

        for (const [index, value] of ['easy', 'normal', 'hard'].entries()) {
          await select.selectOption(value);
          await expect(select).toHaveValue(value);
          await expect(help).toHaveText(descriptions[language][index]);
          await help.scrollIntoViewIfNeeded();
          await expect(help).toBeVisible();
        }

        expect(
          await page
            .locator('.pause-menu')
            .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
        ).toBe(true);
        await help.scrollIntoViewIfNeeded();
        await testInfo.attach(`optionen-${language}`, {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      }
    });
  });
}
