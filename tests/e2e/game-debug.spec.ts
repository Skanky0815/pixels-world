import type { Page } from '@playwright/test';
import { test, expect, waitForLoadingScreen, enterSelectedRoom } from './support';
import type { DebugPort, DebugScenario } from '../../src/dev/game-debug-model';

type Snapshot = ReturnType<DebugPort['read']>;
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Entwickler-Debugmodus' });

async function snapshot(page: Page): Promise<Snapshot | undefined> {
  const raw = await page.locator('#debug-state').textContent();

  return raw ? JSON.parse(raw) : undefined;
}

// eslint-disable-next-line max-lines-per-function -- Gemeinsame Clock-/DOM-Grenze verwendet ausschließlich sichtbare, lesbare Diagnosewerte.
async function untilDebug(page: Page, check: (state: Snapshot) => boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);
        const state = await snapshot(page);

        return state ? check(state) : false;
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toBe(true);
}

// eslint-disable-next-line max-lines-per-function -- Laden wartet auf die szenengebundene DEV-Installation, bevor der echte Tastatur-Shortcut ausgelöst wird.
async function openDebug(page: Page) {
  await page.goto('http://127.0.0.1:4176/play.html');
  await waitForLoadingScreen(page);
  await enterSelectedRoom(page);
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return page.getByRole('button', { name: 'Debug (F2)', exact: true }).count();
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toBe(1);
  await page.keyboard.press('F2');
  await expect(dialog(page)).toBeVisible();
  await untilDebug(page, () => true);
}

// eslint-disable-next-line max-lines-per-function -- Reguläre Formularbedienung startet ein frisches Szenario und wartet auf dessen neue Generation.
async function launch(
  page: Page,
  target: DebugScenario['target'],
  score = 60,
  seed = 42,
  seconds = 90,
) {
  const generation = (await snapshot(page))?.generation ?? 0;

  await dialog(page).getByLabel('Zielphase').selectOption(target);
  await dialog(page).getByLabel('Chaoswert').fill(String(score));
  await dialog(page).getByLabel('Startzeit in Sekunden').fill(String(seconds));
  await dialog(page).getByLabel('Seed', { exact: true }).fill(String(seed));
  await dialog(page).getByRole('button', { name: 'Szenario neu starten' }).click();
  await untilDebug(page, (s) => s.generation > generation);
  await expect(dialog(page)).toBeVisible();
}

test('Debug: F2 öffnet ohne Rundenstart, Eingaben bleiben im Dialog', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Shortcut, Formularfokus und anschließender normaler Start teilen denselben echten Eingabeablauf.
}) => {
  await openDebug(page);
  expect((await snapshot(page))?.started).toBe(false);
  await dialog(page).getByLabel('Seed', { exact: true }).fill('4242');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await page.clock.runFor(500);
  expect(await snapshot(page)).toMatchObject({ started: false, pixel: { x: 110 } });
  await page.keyboard.press('F2');
  await expect(dialog(page)).not.toBeVisible();
  await page.keyboard.down('Space');
  await page.clock.runFor(64);
  await page.keyboard.up('Space');
  await page.keyboard.press('F2');
  await untilDebug(page, (s) => s.started);
  expect((await snapshot(page))?.pixel.animation).toBe('idle');
  expect(await page.evaluate(() => '__pixelTest' in window)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toBeVisible();
});

test('Debug: alle Phasen und beide Ergebnisse verwenden gültige Übergänge', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Sämtliche Szenarien laufen über dieselbe Oberfläche und die echten Szenenübergänge, inklusive selbstständiger Rückkehr.
}) => {
  await openDebug(page);
  const listeners = (await snapshot(page))?.blurListeners;

  for (const target of [
    'chaos',
    'returning',
    'reaction',
    'reconciliation',
    'result-success',
    'result-failed',
  ] as const) {
    await launch(page, target);
    await untilDebug(page, (s) => {
      if (target === 'result-success') return s.reconciliation.stage === 'complete';

      if (target === 'result-failed') return s.reconciliation.stage === 'failed';

      return s.round.phase === target;
    });
    const state = await snapshot(page);

    expect(state?.chaos).toEqual({ score: 60, anger: 'angry' });
    expect(state?.blurListeners).toBe(listeners);
    expect(state?.round.returnAtMs).toBe(90_000);

    if (target !== 'chaos') expect(state?.round.finalChaosScore).toBe(60);
    await expect(page.locator('.game-debug')).toHaveCount(1);
    await expect(page.locator('.game-debug-toggle')).toHaveCount(1);
    await expect(page.locator('.touch-controls')).toHaveCount(1);
  }

  await page.keyboard.press('F2');
  await expect(dialog(page)).not.toBeVisible();
  await page.keyboard.press('F2');
  await expect(dialog(page)).toBeVisible();
});

test('Debug: Rundentimer lässt sich bis zur einmaligen Heimkehr vorspulen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Vorgegebene Startzeit, zwei Vorwärtsschritte und gesperrte Folgeaktionen werden gemeinsam geprüft.
}) => {
  await openDebug(page);
  await launch(page, 'chaos', 25, 7, 20);
  const forward = dialog(page).getByRole('button', { name: 'Rundentimer +10 Sekunden' });

  await forward.click();
  await untilDebug(page, (s) => s.round.elapsedMs >= 10_000);
  expect((await snapshot(page))?.round.phase).toBe('chaos');
  await forward.click();
  await untilDebug(page, (s) => s.round.phase === 'returning');
  expect((await snapshot(page))?.round.finalChaosScore).toBe(25);
  await expect(forward).toBeDisabled();
});

test('Debug: gleicher Seed wiederholt Reaktion und erste Pfeileingabe', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zwei frische Szenarien vergleichen tatsächlich erzeugte Dialoge und Minispieleingaben.
}) => {
  await openDebug(page);
  const samples: unknown[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    await launch(page, 'reconciliation', 60, 123);
    await untilDebug(page, (s) => s.reconciliation.stage === 'reading');
    await page.keyboard.press('F2');
    await page.keyboard.down('Space');
    await page.clock.runFor(32);
    await page.keyboard.up('Space');
    await page.keyboard.press('F2');
    await untilDebug(page, (s) => s.reconciliation.expected !== null);
    const state = await snapshot(page);

    samples.push({
      selection: state?.homecoming.selection,
      expected: state?.reconciliation.expected,
    });
  }

  expect(samples[0]).toEqual(samples[1]);
});

// eslint-disable-next-line max-lines-per-function -- Die deklarative Gruppe begrenzt die Geräteemulation auf diesen mobilen Debug-Ablauf.
test.describe('Debug auf Touch-Geräten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Footer öffnet einen lesbaren Dialog; Szenarien funktionieren per Touch', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Touch-Öffnen, Szenario und Layout passen zusammen in einen überprüfbaren Ablauf.
  }, testInfo) => {
    await openDebug(page);
    await dialog(page).getByRole('button', { name: 'Schließen · F2' }).tap();
    await page.getByRole('button', { name: 'Debug (F2)', exact: true }).tap();
    await expect(dialog(page)).toBeVisible();
    await launch(page, 'reconciliation', 0);
    await untilDebug(page, (s) => s.reconciliation.stage === 'reading');
    const bounds = await dialog(page).boundingBox();

    expect(bounds && bounds.x >= 0 && bounds.width <= 390 && bounds.height <= 844).toBe(true);
    await testInfo.attach('mobile-debug-dialog', {
      body: await dialog(page).screenshot(),
      contentType: 'image/png',
    });
  });
});

for (const [mobile, hasTouch] of [
  [false, false],
  [true, true],
  [false, true],
] as const) {
  // eslint-disable-next-line max-lines-per-function -- Auswahl, fertiges Ergebnis und Neustart bleiben ein zusammenhängender echter Menüablauf.
  test.describe(`Schwieriges Ergebnis ${mobile ? 'mobil' : hasTouch ? 'Touch-Laptop' : 'Desktop'}`, () => {
    test.use({
      hasTouch,
      isMobile: mobile,
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });
    test('Vier Herzen bleiben dem gespielten Grad zugeordnet', async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Die echte DEV-Oberfläche spielt das schwerste Profil fertig; Menüwechsel dürfen dessen Ergebnis nicht verändern.
    }, testInfo) => {
      await openDebug(page);
      await page.keyboard.press('F2');
      await page.locator('.pause-toggle').click();
      await page.locator('[data-menu-settings]').click();
      await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption('hard');
      await page.locator('[data-pause-resume]').click();
      await page.keyboard.press('F2');
      await launch(page, 'result-success', 60);
      await untilDebug(page, (s) => s.reconciliation.stage === 'complete');
      expect((await snapshot(page))?.reconciliation).toMatchObject({
        difficulty: 'hard',
        required: 4,
        successes: 4,
      });
      await page.keyboard.press('F2');

      if (hasTouch) await expect(page.locator('[data-control="reset"]')).toBeVisible();
      else await expect(page.locator('.touch-controls')).toBeHidden();

      if (mobile) {
        await expect(page.locator('.mobile-result')).toBeVisible();
        await expect(page.locator('.result-hearts svg[data-filled="true"]')).toHaveCount(4);
        const hearts = await page.locator('.result-hearts').boundingBox();
        const text = await page.locator('.result-reconciliation').boundingBox();

        expect(hearts!.y).toBeGreaterThanOrEqual(text!.y + text!.height);
        await expect(page.locator('.result-goal')).toHaveCount(0);
        const fits = await page
          .locator('.mobile-result')
          .evaluate((el) => el.scrollWidth <= el.clientWidth);

        expect(fits).toBe(true);
      }

      await testInfo.attach('schwer-vier-herzen', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      await page.locator('.pause-toggle').click();
      await page.locator('[data-menu-settings]').click();
      await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption('easy');
      await page.locator('[data-pause-resume]').click();
      await page.keyboard.press('F2');
      expect((await snapshot(page))?.reconciliation).toMatchObject({
        difficulty: 'hard',
        required: 4,
        successes: 4,
      });
      await page.keyboard.press('F2');

      if (mobile) await expect(page.locator('.result-goal')).toHaveCount(0);
      await page.keyboard.down('Space');
      await page.clock.runFor(96);
      await page.keyboard.up('Space');
      await page.keyboard.press('F2');
      await untilDebug(page, (s) => s.round.phase === 'chaos');
      expect((await snapshot(page))?.round.returnAtMs).toBeGreaterThanOrEqual(90_000);
    });
  });
}
