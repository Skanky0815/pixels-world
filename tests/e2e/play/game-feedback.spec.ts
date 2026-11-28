import {
  test,
  expect,
  start,
  state,
  until,
  besideCouch,
  firstVase,
  holdUntil,
  reset,
  framesPass,
} from '../support/support';
import { openPause } from '../support/pause-support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from '../support/round-clock';
import { DIRECTIONS } from '../../../game/play/content/reconciliation';
import { OBJECTS } from '../../../game/play/content/objects/catalog';

async function expectFeedback(
  page: import('@playwright/test').Page,
  channel: 'score' | 'phase' | 'charm',
  key: string,
) {
  expect((await state(page)).feedback.messages[channel]).toMatchObject({ key });
  await expect(page.locator('.mobile-notice')).toBeVisible();
  await expect(page.locator('.mobile-notice')).toHaveText((await state(page)).feedback.text);
}

test('Schadensfeedback bleibt ohne Punktzahlen lesbar, pausiert und startet nach Reset einmalig', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echte Sofaaktion, Pause, Ablauf und Neustart prüfen denselben szenengebundenen Darstellungszyklus.
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  const before = await state(page);

  expect(before.feedback.messages.score?.value).toBe(OBJECTS['cozy-couch'].rules.damageValue);
  await expect(page.locator('.game-feedback-score')).toContainText('Kratzen');
  await expect(page.locator('.mobile-notice')).not.toContainText('Kratzen');
  await expectPixelFeedback(page);
  await testInfo.attach('desktop-score-feedback', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await openPause(page);
  await page.clock.runFor(4000);
  expect((await state(page)).feedback).toEqual(before.feedback);
  expect((await state(page)).chaos.score).toBe(before.chaos.score);
  await page.keyboard.press('Escape');
  await page.keyboard.down('ArrowLeft');
  await until(page, (s) => s.pixel.x < 140);
  await page.keyboard.up('ArrowLeft');
  await until(page, (s) => !s.feedback.messages.score);
  await expect(page.locator('.mobile-notice')).toHaveText('');
  await reset(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  expect((await state(page)).chaos.score).toBe(OBJECTS['cozy-couch'].rules.damageValue);
  await expect(page.locator('.game-feedback-layer')).toHaveCount(1);
});

test('Phasen, falsche/richtige Pfeile und Herzfortschritt liefern eindeutiges Feedback', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Vollständige echte Heimkehr und Versöhnung prüfen Hinweise bei unveränderten Punkten und Fristen.
}, testInfo) => {
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await expectFeedback(page, 'phase', 'feedbackReturn');
  await until(page, (s) => s.round.phase === 'reaction', 100);
  await expectFeedback(page, 'phase', 'feedbackReaction');
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    100,
  );
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'reading', 100);
  await page.keyboard.up('Space');
  await expectFeedback(page, 'phase', 'feedbackCharm');
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  await page.keyboard.up('Space');
  const expected = (await state(page)).reconciliation.expected;
  const wrongDirection = DIRECTIONS.find((direction) => direction !== expected) ?? 'left';

  await page.keyboard.down(`Arrow${wrongDirection[0].toUpperCase()}${wrongDirection.slice(1)}`);
  await until(page, (s) => s.reconciliation.failures === 1, 100);
  await page.keyboard.up(`Arrow${wrongDirection[0].toUpperCase()}${wrongDirection.slice(1)}`);
  await expectFeedback(page, 'charm', 'feedbackWrong');
  expect((await state(page)).feedback.messages.charm).toMatchObject({ tone: 'negative' });
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'cue', 100);
  await page.keyboard.up('Space');
  const length = (await state(page)).reconciliation.length;

  for (let index = 0; index < length; index++) {
    await until(page, (s) => s.reconciliation.stage === 'input', 100);
    const next = (await state(page)).reconciliation.expected ?? 'left';
    const key = `Arrow${next[0].toUpperCase()}${next.slice(1)}`;

    await page.keyboard.down(key);
    await until(
      page,
      (s) => s.reconciliation.step > index || s.reconciliation.successes === 1,
      100,
    );
    await page.keyboard.up(key);
    expect((await state(page)).feedback.messages.charm).toMatchObject({ tone: 'positive' });
  }

  await expectFeedback(page, 'charm', 'feedbackHeart');
  await until(page, (s) => s.reconciliation.stage === 'complete', 100);
  await expectFeedback(page, 'phase', 'feedbackResultSuccess');
  expect((await state(page)).chaos.score).toBe(0);
  expect((await state(page)).result).toMatchObject({ outcome: 'success' });
  await testInfo.attach('desktop-result-feedback', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('Bewegungswunsch wird gespeichert; Hinweise bleiben ohne Bewegung erhalten', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echte Einstellung, Reload und aktive Hinweise prüfen den gespeicherten Wunsch ohne Gameplay-Eingriffe.
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await start(page);
  await openPause(page);
  await page.getByRole('checkbox', { name: 'Bewegung reduzieren' }).check();
  await page.keyboard.press('Escape');
  await start(page);
  expect((await state(page)).feedback.reduced).toBe(true);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  await expect(page.locator('.game-feedback-score')).toHaveCSS('transform', 'none');
  await expect(page.locator('.game-feedback-score')).toHaveCSS('opacity', '1');
  await openPause(page);
  await page.getByRole('checkbox', { name: 'Bewegung reduzieren' }).uncheck();
  expect((await state(page)).feedback.reduced).toBe(false);
});

// eslint-disable-next-line max-lines-per-function -- Die Gerätegruppe verbindet Systemvorgabe mit dem tatsächlichen kompakten HUD im Handheld.
test.describe('Feedback im Handheld mit reduzierter Bewegung', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 844, height: 390 },
    reducedMotion: 'reduce',
  });

  test('Systemvorgabe bleibt aktiv, Statusfeedback verdeckt weder Zimmer noch Steuerung', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Systemvorgabe, echte Punkteaktion und eine Aufnahme des mobilen Layouts gehören zu einem Ablauf.
  }, testInfo) => {
    await start(page);
    await openPause(page);
    await expect(page.getByRole('checkbox', { name: 'Bewegung reduzieren' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Bewegung reduzieren' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    expect((await state(page)).feedback.reduced).toBe(true);
    await expect(page.locator('.game-feedback-score')).toContainText('Kratzen');
    await expect(page.locator('.mobile-hud')).not.toContainText('Kratzen');
    await expectPixelFeedback(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await testInfo.attach('mobile-feedback-status', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});

// eslint-disable-next-line max-lines-per-function -- Der sichtbare DOM-Text wird gegen Canvas und projizierte Pixelposition geprüft.
async function expectPixelFeedback(page: import('@playwright/test').Page) {
  const notice = page.locator('.game-feedback-score');

  await expect(notice).toBeVisible();
  const score = await notice.boundingBox();
  const canvas = await page.locator('canvas').boundingBox();
  const s = await state(page);

  if (!score || !canvas) throw new Error('Feedback fehlt');
  const viewLeft = s.camera.x + (s.camera.width - s.camera.width / s.camera.zoom) / 2;
  const pixelX =
    canvas.x + ((s.pixel.x - viewLeft) * s.camera.zoom * canvas.width) / s.camera.width;

  expect(score.x).toBeGreaterThanOrEqual(canvas.x);
  expect(score.x + score.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  expect(score.y).toBeGreaterThanOrEqual(canvas.y);
  expect(score.y + score.height).toBeLessThanOrEqual(canvas.y + canvas.height);
  expect(Math.abs(score.x + score.width / 2 - pixelX)).toBeLessThanOrEqual(score.width / 2 + 8);
}

for (const view of [
  { width: 1280, height: 900, path: '/?camera=room' },
  { width: 960, height: 720, path: '/' },
  { width: 390, height: 844, path: '/' },
]) {
  test(`Pixelmeldung folgt der Figur bis zum Rand und bleibt lesbar (${view.width})`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Reale Bewegung prüft Folgen, Canvasrand, Mindestdauer und Größenwechsel im selben Ereignis.
  }) => {
    await page.setViewportSize(view);
    await start(page, view.path);
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    const score = page.locator('.game-feedback-score');
    const before = await score.boundingBox();

    await page.keyboard.down('ArrowLeft');
    await until(page, (s) => s.pixel.x < 35);
    await page.keyboard.up('ArrowLeft');
    await expectPixelFeedback(page);
    const after = await score.boundingBox();

    expect(after?.x).toBeLessThan(before?.x ?? 0);
    await resizeFeedbackViewport(page, { width: view.height, height: view.width });
    await expectPixelFeedback(page);
    const message = (await state(page)).feedback.messages.score;

    if (!message) throw new Error('Meldung vor Ablauf verschwunden');
    await page.clock.runFor(Math.max(0, 1500 - message.elapsedMs));
    await expect(score).toBeVisible();
    await expect(score).toHaveCSS('opacity', '1');
  });
}

// eslint-disable-next-line max-lines-per-function -- Größenwechsel, angepasste Kamera und der folgende Renderframe bilden eine gemeinsame Bereitschaftsgrenze.
async function resizeFeedbackViewport(
  page: import('@playwright/test').Page,
  viewport: { width: number; height: number },
) {
  const previous = await page.locator('canvas').boundingBox();

  if (!previous) throw new Error('Canvas fehlt vor dem Größenwechsel');
  await page.setViewportSize(viewport);
  await expect
    .poll(
      // eslint-disable-next-line max-lines-per-function -- Aktive Testzeit und atomare Canvas-/Kameraprobe gehören in denselben Pollschritt.
      async () => {
        await page.clock.runFor(16);

        return page.locator('canvas').evaluate((canvas, before) => {
          const bounds = canvas.getBoundingClientRect();
          const camera = window.__pixelTest?.camera;
          const resized = bounds.width !== before.width || bounds.height !== before.height;

          return (
            !!camera &&
            resized &&
            Math.abs(camera.width / camera.height - bounds.width / bounds.height) < 0.01
          );
        }, previous);
      },
      { intervals: [0] },
    )
    .toBe(true);
  await framesPass(page, 1);
}

for (const viewport of [
  { width: 1280, height: 900, touch: false },
  { width: 390, height: 844, touch: true },
  { width: 568, height: 320, touch: true },
  { width: 320, height: 400, touch: true },
]) {
  // eslint-disable-next-line max-lines-per-function -- Dieselbe Schadenskette wird in vier echten Geräteansichten geprüft.
  test.describe(`Schadensketten ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.touch, isMobile: viewport.touch });
    test('Mehrere Schäden bleiben getrennt oder gebündelt lesbar und geben Touchflächen frei @smoke', async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Reale Schadenskette, Pause und Reset prüfen denselben begrenzten Anzeigestapel.
    }) => {
      await start(page, '/?room-seed=shelves-172');
      await damageChain(page);
      const scores = (await state(page)).feedback.scores;

      expect(scores.length).toBeGreaterThan(1);
      expect(scores.length).toBeLessThanOrEqual(3);
      expect(scores.reduce((count, score) => count + score.count, 0)).toBeGreaterThanOrEqual(2);
      await expectReadableStack(page);
      await test.info().attach('schadenskette', {
        body: await page.screenshot({
          path: `/private/tmp/pixels402-chain-${viewport.width}.png`,
        }),
        contentType: 'image/png',
      });
      await openPause(page);
      const paused = (await state(page)).feedback.scores;

      await page.clock.runFor(5000);
      expect((await state(page)).feedback.scores).toEqual(paused);
      await page.locator('[data-language="en"]').click();
      expect((await state(page)).feedback.scores).toEqual(paused);
      await page.keyboard.press('Escape');
      await framesPass(page, 1);
      await expectReadableStack(page);
      await until(page, (s) => s.feedback.scores.length === 0);
      expect((await state(page)).feedback.scores).toEqual([]);
      await reset(page);
      expect((await state(page)).feedback.scores).toEqual([]);
    });
  });
}

// eslint-disable-next-line max-lines-per-function -- Drei echte Landungen lösen denselben begrenzten Regal-/Vasen-/Bücherkontakt wie im regulären Spiel aus.
async function damageChain(page: import('@playwright/test').Page) {
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 560);

  for (const landings of [2, 3]) {
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(page, (s) => s.shelves[0].landings === landings);
  }

  await until(page, (s) => s.pixel.grounded && s.pixel.bottom === 468);
  await until(page, (s) =>
    s.vases.filter((v) => v.id.startsWith('lower-shelf:')).every((v) => v.state === 'broken'),
  );
  await until(page, (s) =>
    s.books
      .filter((book) => book.supportY === 304)
      .every((book) => book.state === 'fallen' && !book.dropping),
  );
}

// eslint-disable-next-line max-lines-per-function -- Tatsächliche Text-, Canvas- und Overlayrechtecke prüfen lesbaren Umbruch statt abgeschnittener Meldungen.
async function expectReadableStack(page: import('@playwright/test').Page) {
  const score = page.locator('.game-feedback-score');

  await expect(score).toBeVisible();
  // eslint-disable-next-line max-lines-per-function -- Eine atomare DOM-Probe erfasst Text und sämtliche Overlaygrenzen im selben Renderstand.
  const geometry = await score.evaluate((stack) => {
    const canvas = document.querySelector('canvas')!.getBoundingClientRect();
    const bounds = stack.getBoundingClientRect();
    const rows = Array.from(stack.querySelectorAll<HTMLElement>('p:not([hidden])'));
    const obstacles = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.touch-directions, .touch-actions, .album-banner, .mobile-hud, .mobile-dialogue',
      ),
    )
      .filter((node) => !node.closest('[hidden]') && getComputedStyle(node).display !== 'none')
      .map((node) => node.getBoundingClientRect());
    const intersects = (box: DOMRect) =>
      bounds.left < box.right &&
      bounds.right > box.left &&
      bounds.top < box.bottom &&
      bounds.bottom > box.top;

    return {
      contained:
        bounds.left >= canvas.left &&
        bounds.right <= canvas.right &&
        bounds.top >= canvas.top &&
        bounds.bottom <= canvas.bottom,
      readable: rows.every(
        (row) => row.scrollWidth <= row.clientWidth && row.scrollHeight <= row.clientHeight,
      ),
      overlaps: obstacles.filter(intersects).length,
      rows: rows.map((row) => ({
        top: row.getBoundingClientRect().top,
        bottom: row.getBoundingClientRect().bottom,
      })),
    };
  });

  expect(geometry.contained).toBe(true);
  expect(geometry.readable).toBe(true);
  expect(geometry.overlaps).toBe(0);

  for (let index = 1; index < geometry.rows.length; index++)
    expect(geometry.rows[index].top).toBeGreaterThanOrEqual(geometry.rows[index - 1].bottom);
}
