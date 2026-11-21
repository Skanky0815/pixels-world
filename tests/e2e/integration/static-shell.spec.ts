import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test(
  'Gemeinsame Seiteninformationen sind ohne JavaScript im Root und Pages-Unterpfad erreichbar',
  { tag: '@integration' },
  // eslint-disable-next-line max-lines-per-function -- Alle öffentlichen Varianten werden mit demselben statischen Auslieferungsvertrag geprüft.
  async ({ page }) => {
    for (const base of ['http://127.0.0.1:4174', 'http://127.0.0.1:4175/pixels-world']) {
      for (const entry of ['', 'help.html', 'play.html', 'impressum.html', 'datenschutz.html']) {
        await page.goto(`${base}/${entry}`);
        const footer = page.locator('main > footer');

        await expect(page.locator('main > header')).toHaveCount(1);
        await expect(footer).toHaveCount(1);
        await expect(footer.locator('#build-info')).toContainText("Pixel's World · v");
        await expect(footer.locator('.ai-disclosure')).toContainText('mit KI erstellt');
        await expect(footer.locator('.age-number')).toHaveText('6');
        await expect(page.locator('meta[name="age-meta-label"]')).toHaveAttribute(
          'content',
          'age=6',
        );
        await expect(footer.getByRole('link', { name: 'Impressum' })).toHaveAttribute(
          'href',
          './impressum.html',
        );
        await expect(footer.getByRole('link', { name: 'Feedback & Ideen' })).toHaveAttribute(
          'rel',
          'noopener noreferrer',
        );
        expect(
          await page.locator('[id]').evaluateAll((nodes) => {
            const ids = nodes.map((node) => node.id);

            return ids.length === new Set(ids).size;
          }),
        ).toBe(true);
      }
    }
  },
);
