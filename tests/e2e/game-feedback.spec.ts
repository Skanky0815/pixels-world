import { test, expect, start, state, until, besideCouch, reset } from './support';
import { openPause } from './pause-support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';
import { DIRECTIONS } from '../../src/content/reconciliation';
import { OBJECTS } from '../../src/content/objects/catalog';

async function expectFeedback(
  page: import('@playwright/test').Page,
  channel: 'score' | 'phase' | 'charm',
  key: string,
) {
  expect((await state(page)).feedback.messages[channel]).toMatchObject({ key });
  await expect(page.locator('.mobile-notice')).toBeVisible();
  await expect(page.locator('.mobile-notice')).toHaveText((await state(page)).feedback.text);
}

test('Punktefeedback zeigt echte Punkte, friert mit Pause ein und bleibt nach Reset einmalig', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echte Sofaaktion, Pause, Ablauf und Neustart prüfen denselben szenengebundenen Darstellungszyklus.
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  const before = await state(page);

  expect(before.feedback.messages.score?.value).toBe(OBJECTS['cozy-couch'].rules.damageValue);
  await expect(page.locator('.mobile-notice')).toContainText(
    `+${OBJECTS['cozy-couch'].rules.damageValue}`,
  );
  await expectFeedbackCorner(page);
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
    await expect(page.locator('.mobile-hud')).toContainText(
      `+${OBJECTS['cozy-couch'].rules.damageValue}`,
    );
    await expect(page.locator('.game-feedback-layer')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await testInfo.attach('mobile-feedback-status', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});

async function expectFeedbackCorner(page: import('@playwright/test').Page) {
  const score = await page.locator('.mobile-hud').boundingBox();
  const layer = await page.locator('#game').boundingBox();

  if (!score || !layer) throw new Error('Feedback fehlt');
  expect(score.y).toBeLessThan(layer.y + layer.height * 0.2);
  expect(score.x + score.width).toBeGreaterThan(layer.x + layer.width * 0.8);
}
