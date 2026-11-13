import {
  introAction,
  test,
  expect,
  start,
  state,
  until,
  reset,
  besideCouch,
  waitForGame,
} from './support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';
import type { Page } from '@playwright/test';

const full = process.env.E2E_FULL_ROUND === '1';
const tag = full ? '@slow' : '@fast';
const keys = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

// eslint-disable-next-line max-lines-per-function -- Der gemeinsame Einstieg durchläuft Heimkehr und explizite Bestätigung mit realen Eingaben.
async function enterCharm(page: Page, damage = false) {
  await seedRoundRandom(page);
  await start(page, full ? '/' : '/?round-profile=fast');

  if (damage) {
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
  }

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
    await enterCharm(page, true);
    const frozen = await state(page);

    expect(frozen.reconciliation.required).toBe(1);
    expect(frozen.charmDisplay.heartsText).toBe('♡ · 0/1');

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
      expect((await state(page)).charmDisplay.heartsText).toBe('♥ · 1/1');
    }

    await until(page, (s) => s.reconciliation.stage === 'complete', 100);
    const complete = await state(page);

    expect(complete.chaos).toEqual(frozen.chaos);
    expect(complete.objects).toEqual(frozen.objects);
    expect(complete.pixel.x).toBeCloseTo(frozen.pixel.x, 1);
    expect(complete.reconciliation.progress).toBe(1);
    expect(complete.sara.canvasTextVisible).toBe(false);
    expect(complete.charmMotion).toMatchObject({ action: 'roll', phase: 'loop' });
    expect(complete.pixel.visualTexture).toBe('pixel-charm');
    expect(complete.pixel.displayWidth).toBe(96);
    expect(complete.ending.kind).toBe('belly');
    expect(complete.sara.texture).toBe('sara-ending');
    expect(complete.sara.animationKey).toBe('sara-ending-belly');
    await expectEndingPause(page);
    await until(page, (s) => s.ending.complete);
    expect((await state(page)).sara.frame).toBe(5);
    await expectResult(page, 'success');
    expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.reconciliation))).toBe(
      true,
    );
    await test
      .info()
      .attach('versoehnt', { body: await page.screenshot(), contentType: 'image/png' });
    await continueCharm(page);
    await until(page, (s) => s.generation > complete.generation);
    expect((await state(page)).reconciliation.stage).toBe('waiting');
    await expectFreshRound(page);
    expect((await state(page)).ending.kind).toBeNull();
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
    expect((await state(page)).charmMotion.action).toBe('purr');
    await page.keyboard.down(keys[expected]);
    await page.clock.runFor(100);
    expect((await state(page)).reconciliation.step).toBe(1);
    await page.keyboard.up(keys[expected]);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const paused = (await state(page)).reconciliation;
    const pausedMotion = (await state(page)).charmMotion;

    await page.clock.runFor(5000);
    expect((await state(page)).reconciliation).toEqual(paused);
    expect((await state(page)).charmMotion).toEqual(pausedMotion);
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
    expect((await state(page)).charmMotion.action).toBeNull();
  },
);

test(
  'Charme scheitert nach zwei Versuchen und verwirft nur neue Album-Funde',
  { tag: [tag, '@smoke'] },
  // eslint-disable-next-line max-lines-per-function -- Zwei gescheiterte Versuche prüfen Welt-Freeze, Album-Speicherschutz, Ergebnis und Neustart gemeinsam.
  async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}');

      if (!localStorage.getItem('pixels-world.album'))
        localStorage.setItem(
          'pixels-world.album',
          JSON.stringify({ version: 1, discovered: ['vase.blue'] }),
        );
    });
    await enterCharm(page, true);
    expect((await state(page)).album.pending).toEqual(['couch.cozy']);
    const frozen = await state(page);

    await until(page, (s) => s.reconciliation.feedback === 'timeout', 100);
    expect((await state(page)).reconciliation.attemptsLeft).toBe(1);
    await continueCharm(page);
    await until(page, (s) => s.reconciliation.stage === 'failed', 100);
    const failed = await state(page);

    await page.clock.runFor(5000);
    expect((await state(page)).reconciliation).toEqual(failed.reconciliation);
    expect(failed.chaos).toEqual(frozen.chaos);
    expect(failed.objects).toEqual(frozen.objects);
    expect(failed.ending.kind).toBe('sulk');
    expect((await state(page)).sara.frame).toBe(15);
    const held = (await state(page)).sara;

    await page.clock.runFor(1000);
    expect((await state(page)).sara).toEqual(held);
    await expectResult(page, 'failed');
    expect(failed.result).toMatchObject({
      newDiscoveries: 0,
      albumText: 'Neue Album-Einträge: 0 · Versöhnung nicht geschafft.',
    });
    expect((await state(page)).album).toEqual({ pending: [], confirmed: [], completed: true });
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
    ).toEqual(['vase.blue']);
    await page.locator('.album-toggle').click();
    await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 1 von 14');
    await expect(page.locator('.album-dialog')).not.toContainText('Das gemütliche Sofa');
    await page.locator('.album-dialog [data-action="close"]').click();
    await test.info().attach('versoehnung-gescheitert', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await continueCharm(page);
    await until(page, (s) => s.generation > failed.generation);
    expect((await state(page)).reconciliation).toMatchObject({ stage: 'waiting', attemptsLeft: 2 });
    await expectFreshRound(page);
    expect((await state(page)).ending.kind).toBeNull();
    await page.reload();
    await waitForGame(page);
    await (await introAction(page, 'album')).click();
    await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 1 von 14');
  },
);

// eslint-disable-next-line max-lines-per-function -- Sichtbare Ergebniswerte, Unveränderlichkeit und stabiler Abschluss werden zusammen geprüft.
async function expectResult(page: Page, outcome: 'success' | 'failed') {
  await expect(page.locator('[data-control="reset"]')).toBeHidden();
  await expect(page.locator('.touch-controls')).toBeHidden();
  const current = await state(page);

  const result = current.result;

  if (!result) throw new Error('Ergebnis fehlt');
  expect(result).toMatchObject({
    visible: true,
    score: current.round.finalChaosScore,
    outcome,
    dialogue: current.homecoming.selection?.dialogue,
    hearts: current.reconciliation.successes,
  });
  expect(result.summaryText).toContain(`Chaospunkte: ${current.chaos.score}`);
  expect(result.summaryText).toContain(outcome === 'success' ? 'Gelungen' : 'Gescheitert');
  expect(result.hint).toBe('␣: Neue Runde starten');
  expect(result.goalReached).toBe(current.round.endReason === 'goal');
  expect(result.summaryText).not.toMatch(/Hauptziel|Schwierigkeitsgrad/);
  expect(result.headlineText).toBe(outcome === 'success' ? 'Wieder vertragen!' : 'Nicht versöhnt');
  expect(result.heartsText).toBe(
    '♥'.repeat(result.hearts) + '♡'.repeat(result.required - result.hearts),
  );
  expect(result.quoteText).toBe(`Sara: „${result.closingLine}“`);
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.result))).toBe(true);
  await page.clock.runFor(3000);
  expect((await state(page)).result).toEqual(current.result);
}

// eslint-disable-next-line max-lines-per-function -- Ergebnis, Uhr, Schaden, Figur und Heimkehr müssen beim bestehenden Tastaturneustart gemeinsam zurückgesetzt werden.
async function expectFreshRound(page: Page) {
  const fresh = await state(page);

  expect(fresh.result).toBeNull();
  expect(fresh.round.phase).toBe('chaos');
  expect(fresh.round.finalChaosScore).toBeNull();
  expect(fresh.round.elapsedMs).toBeLessThan(500);
  expect(fresh.chaos.score).toBe(0);
  expect(fresh.objects.every((object) => object.damage === 0 && object.events === 0)).toBe(true);
  expect(fresh.pixel.x).toBeCloseTo(110, 0);
  expect(fresh.homecoming.stage).toBe('waiting');
  expect(fresh.pixelReturn.stage).toBe('waiting');
}

for (const width of [390, 1024]) {
  test(`Charme-Animationen sind bei ${width}px sichtbar und bleiben ohne Bewegung statisch`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Beide Gerätegrößen durchlaufen echte Treffer, Pfötchen, Bauchpose und die statische Bewegungsalternative.
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await enterCharm(page);
    const seated = (await state(page)).pixel;

    await correctArrow(page);
    expect((await state(page)).charmMotion.action).toBe('purr');
    await correctArrow(page);
    expect((await state(page)).charmMotion.action).toBe('paw');
    expect((await state(page)).pixel.displayWidth).toBe(64);
    await correctArrow(page);
    await until(page, (s) => s.charmMotion.phase === 'loop', 100);
    const belly = await state(page);

    expect(belly.charmMotion.action).toBe('roll');
    expect(belly.pixel.visualTexture).toBe('pixel-charm');
    expect(belly.pixel.visualFrame).toBeGreaterThanOrEqual(8);
    expect(belly.pixel.x).toBe(seated.x);
    expect(belly.pixel.bottom).toBe(seated.bottom);
    expect(belly.pixel.visualX + belly.pixel.displayWidth / 2).toBeLessThan(belly.room.width);
    await test
      .info()
      .attach(`charme-${width}px`, { body: await page.screenshot(), contentType: 'image/png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.runFor(100);
    const reduced = (await state(page)).pixel;

    await page.clock.runFor(5000);
    const held = (await state(page)).pixel;

    expect([held.visualFrame, held.visualX, held.visualY, held.displayHeight]).toEqual([
      reduced.visualFrame,
      reduced.visualX,
      reduced.visualY,
      reduced.displayHeight,
    ]);
    expect(held.visualFrame).toBe(8);
    expect((await state(page)).reconciliation.stage).toBe('complete');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

// eslint-disable-next-line max-lines-per-function -- Pause und Wechsel zur ruhigen Endpose dürfen weder Zeit noch Pixels Anker verändern.
async function expectEndingPause(page: Page) {
  await page.locator('.pause-toggle').click();
  const paused = await state(page);

  await page.clock.runFor(2000);
  expect((await state(page)).ending).toEqual(paused.ending);
  expect((await state(page)).sara).toEqual(paused.sara);
  const reduced = page.getByRole('checkbox', { name: 'Bewegung reduzieren' });

  await reduced.check();
  expect((await state(page)).sara.frame).toBe(5);
  expect((await state(page)).pixel.visualX).toBe(paused.pixel.visualX);
  await page.clock.runFor(1000);
  expect((await state(page)).ending).toEqual(paused.ending);
  await reduced.uncheck();
  await page.locator('[data-pause-resume]').click();
  await until(page, (s) => s.ending.elapsed > paused.ending.elapsed);
}
