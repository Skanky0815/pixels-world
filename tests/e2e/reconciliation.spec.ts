import { test, expect, start, state, until, reset } from './support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';
import type { Page } from '@playwright/test';

const full = process.env.E2E_FULL_ROUND === '1';
const tag = full ? '@slow' : '@fast';
const keys = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

// eslint-disable-next-line max-lines-per-function -- Der gemeinsame Einstieg durchläuft Heimkehr und explizite Bestätigung mit realen Eingaben.
async function enterCharm(page: Page) {
  await seedRoundRandom(page);
  await start(page, full ? '/' : '/?round-profile=fast');
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    500,
  );
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'reading', 100);
  await page.keyboard.up('Space');
  const reading = (await state(page)).reconciliation;

  await page.clock.runFor(5000);
  expect((await state(page)).reconciliation).toEqual(reading);
  await continueCharm(page);
}

async function continueCharm(page: Page) {
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  await page.keyboard.up('Space');
}

async function pressArrow(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  await page.keyboard.up(key);
}

async function correctArrow(page: Page) {
  if ((await state(page)).reconciliation.stage === 'feedback') await continueCharm(page);
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  const expected = (await state(page)).reconciliation.expected;

  expect(expected).not.toBeNull();

  if (expected) await pressArrow(page, keys[expected]);
}

test(
  'Charme: letzter Versuch, Herzen und vollständiger Abschluss',
  { tag },
  // eslint-disable-next-line max-lines-per-function -- Die komplette zweite Spielphase wird ausschließlich mit echten Tasten bis zum Abschluss und Reset gespielt.
  async ({ page }) => {
    await enterCharm(page);
    const frozen = await state(page);

    await until(page, (s) => s.reconciliation.stage === 'input', 100);
    const expected = (await state(page)).reconciliation.expected;

    await test
      .info()
      .attach('charme-eingabe', { body: await page.screenshot(), contentType: 'image/png' });
    await pressArrow(page, expected === 'left' ? 'ArrowRight' : 'ArrowLeft');
    expect((await state(page)).reconciliation.feedback).toBe('wrong');
    const feedback = (await state(page)).reconciliation;

    await page.clock.runFor(5000);
    expect((await state(page)).reconciliation).toEqual(feedback);
    await continueCharm(page);
    expect((await state(page)).reconciliation.attemptsLeft).toBe(1);
    expect((await state(page)).reconciliation.inputMs).toBeGreaterThan(1800);
    const required = (await state(page)).reconciliation.required;

    for (let sequence = 0; sequence < required; sequence++) {
      for (let step = 0; step < frozen.reconciliation.length; step++) await correctArrow(page);
      expect((await state(page)).reconciliation.successes).toBe(sequence + 1);
    }

    await until(page, (s) => s.reconciliation.stage === 'complete', 100);
    const complete = await state(page);

    expect(complete.chaos).toEqual(frozen.chaos);
    expect(complete.objects).toEqual(frozen.objects);
    expect(complete.pixel.x).toBeCloseTo(frozen.pixel.x, 1);
    expect(complete.reconciliation.progress).toBe(1);
    expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.reconciliation))).toBe(
      true,
    );
    await test
      .info()
      .attach('versoehnt', { body: await page.screenshot(), contentType: 'image/png' });
    await reset(page);
    expect((await state(page)).reconciliation.stage).toBe('waiting');
  },
);

test(
  'Charme: gehaltene Tasten, Browserpause und R während einer Folge',
  { tag },
  // eslint-disable-next-line max-lines-per-function -- Flanken, Fokus und Visibility prüfen denselben aktiven Eingabetimer ohne Spielzustandsschreiber.
  async ({ page }) => {
    await enterCharm(page);
    await until(page, (s) => s.reconciliation.stage === 'input', 100);
    const expected = (await state(page)).reconciliation.expected;

    if (!expected) throw new Error('Missing arrow');
    await page.keyboard.down(keys[expected]);
    await page.clock.runFor(100);
    const first = (await state(page)).reconciliation;

    expect(first.step).toBe(1);
    await page.clock.runFor(800);
    await page.keyboard.down(keys[expected]);
    await page.clock.runFor(100);
    expect((await state(page)).reconciliation.step).toBe(1);
    await page.keyboard.up(keys[expected]);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const paused = (await state(page)).reconciliation;

    await page.clock.runFor(5000);
    expect((await state(page)).reconciliation).toEqual(paused);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.clock.runFor(100);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hidden = (await state(page)).reconciliation;

    await page.clock.runFor(5000);
    expect((await state(page)).reconciliation).toEqual(hidden);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await reset(page);
    expect((await state(page)).reconciliation).toMatchObject({
      stage: 'waiting',
      successes: 0,
      failures: 0,
    });
  },
);

// eslint-disable-next-line max-lines-per-function -- Zwei gescheiterte Versuche prüfen terminales Ergebnis, unveränderte Welt und vollständigen Neustart.
test('Charme scheitert nach zwei Versuchen am selben Herz', { tag }, async ({ page }) => {
  await enterCharm(page);
  const frozen = await state(page);

  await until(page, (s) => s.reconciliation.feedback === 'timeout', 100);
  expect((await state(page)).reconciliation.attemptsLeft).toBe(1);
  await continueCharm(page);
  await until(page, (s) => s.reconciliation.stage === 'failed', 100);
  const failed = await state(page);

  await continueCharm(page);
  await page.clock.runFor(5000);
  expect((await state(page)).reconciliation).toEqual(failed.reconciliation);
  expect(failed.chaos).toEqual(frozen.chaos);
  expect(failed.objects).toEqual(frozen.objects);
  await test
    .info()
    .attach('versoehnung-gescheitert', { body: await page.screenshot(), contentType: 'image/png' });
  await reset(page);
  expect((await state(page)).reconciliation).toMatchObject({ stage: 'waiting', attemptsLeft: 2 });
});
