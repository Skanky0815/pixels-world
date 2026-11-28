/* eslint-disable max-lines-per-function -- Optionsseite, Tastaturfokus und Rückkehr werden mit echten Eingaben in derselben Runde geprüft. */
import { test, expect, start, state } from '../support/support';

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
])
  test(`Optionen sind ein eigener Bildschirm ohne Hauptmenüaktionen ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await start(page);
    await page.keyboard.press('Escape');
    await page.locator('[data-menu-settings]').click();
    const menu = page.locator('.game-menu');
    const before = await state(page);

    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-label', 'Optionen');
    await expect(page.locator('#play-area')).toBeHidden();
    await expect(menu.locator('.pause-actions')).toBeHidden();
    const back = page.locator('main > header .pause-toggle');
    const headerBounds = await page.locator('main > header').boundingBox();

    await expect(back).toBeFocused();
    await expect(back).toHaveAccessibleName('Hauptmenü');
    await expect(back).toBeInViewport({ ratio: 1 });
    await expect(menu.locator('[data-menu-back]')).toHaveCount(0);
    await expect(menu.locator('[data-menu-settings]')).toBeHidden();
    await expect(menu.locator('[data-menu-view="settings"]')).toBeVisible();
    expect(
      await menu.locator('.menu-settings').evaluate((element) => {
        const host = element.parentElement!;
        const style = getComputedStyle(host);
        const available =
          host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

        return Math.abs(element.getBoundingClientRect().width - available) < 1;
      }),
    ).toBe(true);
    expect(await menu.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await test.info().attach(`Optionen-${viewport.width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await page.locator('.album-toggle').click();
    await expect(page.locator('.album-dialog')).toBeVisible();
    await page.locator('.album-dialog [data-action="close"]').click();
    await expect(page.locator('.album-toggle')).toBeFocused();
    await expect(menu.locator('[data-menu-view="settings"]')).toBeVisible();
    await page.locator('[data-language="en"]').click();
    await page.clock.runFor(500);
    expect((await state(page)).round.elapsedMs).toBe(before.round.elapsedMs);
    await expect(menu).toHaveAttribute('aria-label', 'Options');
    await expect(back).toHaveAccessibleName('Main menu');
    expect(await page.locator('main > header').boundingBox()).toEqual(headerBounds);
    await page.locator('main > header .pause-toggle').click();
    await expect(page.locator('[data-menu-settings]')).toBeFocused();
    await expect(menu.locator('.pause-actions')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#play-area')).toBeVisible();
    expect((await state(page)).generation).toBe(before.generation);
  });

for (const blocked of [false, true])
  test(`Einstellungen bestätigen die Übernahme, nächste Runde und Sprachwechsel${blocked ? ' auch bei blockiertem Speicher' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    if (blocked)
      await page.addInitScript(() => {
        Storage.prototype.setItem = () => {
          throw new DOMException('blocked', 'SecurityError');
        };
      });
    await start(page);
    await page.keyboard.press('Escape');
    await page.locator('[data-menu-settings]').click();
    const feedback = page.locator('.menu-settings-feedback');
    const volume = page.locator('[data-audio="master"]');

    await expect(feedback).toHaveAttribute('role', 'status');
    await expect(feedback).toHaveText('Änderungen werden direkt übernommen.');
    await volume.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(volume).toHaveValue('1');
    await expect(volume).toBeFocused();
    await expect(feedback).toHaveText('✓ Einstellungen übernommen.');
    await expect(feedback).toBeInViewport({ ratio: 1 });
    await page.locator('[data-difficulty]').selectOption('hard');
    await expect(feedback).toContainText('ab der nächsten Runde');
    expect((await state(page)).difficulty).toBe('normal');
    await page.locator('[data-wasd]').check();
    await expect(feedback).toHaveText('✓ Einstellungen übernommen.');
    await expect(page.locator('[data-wasd]')).toBeChecked();
    await page.locator('[data-reduce-motion]').check();
    await expect(feedback).toHaveText('✓ Einstellungen übernommen.');
    await expect(feedback).toBeInViewport({ ratio: 1 });
    await test.info().attach(`Bestätigung-${blocked ? 'Sitzung' : 'gespeichert'}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.locator('[data-remember-album]').check();
    await expect(feedback).toHaveText('✓ Einstellungen übernommen.');
    await page.locator('[data-language="en"]').click();
    await expect(feedback).toHaveText('✓ Settings applied.');
    await page.locator('[data-difficulty]').selectOption('easy');
    await expect(feedback).toHaveText('✓ Applied. The difficulty takes effect next round.');
    await page.locator('main > header .pause-toggle').click();
    await expect(feedback).toBeHidden();
    await page.locator('[data-menu-settings]').click();
    await expect(feedback).toHaveText('Changes are applied immediately.');
    await expect(page.locator('[data-audio="master"]')).toHaveValue('1');
    await expect(page.locator('[data-wasd]')).toBeChecked();
    await expect(page.locator('[data-difficulty]')).toHaveValue('easy');
    await test.info().attach(`Optionen-Feedback-${blocked ? 'Sitzung' : 'gespeichert'}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
