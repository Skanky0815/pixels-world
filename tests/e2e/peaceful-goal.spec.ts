import { test, expect, start, state, until, besideCouch } from './support';
import { climbToBall } from './goal-support';
import { changeLanguage } from './pause-support';
import { PEACEFUL_GOAL_LINES } from '../../src/content/peaceful-goal';
import { copy, resolveText } from '../../src/i18n/locale';

test(
  'Friedlicher Fund: sofortiger Satz, Sprachwechsel und Abschluss ohne Minispiel',
  { tag: '@smoke' },
  // eslint-disable-next-line max-lines-per-function -- Der vollständige friedliche Nutzerpfad prüft echte Eingaben, Sprachwechsel, gehaltene Taste und Neustart.
  async ({ page }) => {
    await start(page);
    await climbToBall(page);
    await until(page, (s) => s.ballPlay.active);
    const found = await state(page);
    const line = found.sara.dialogueText.split('\n')[1];
    const key = PEACEFUL_GOAL_LINES.find((key) => copy(key) === line);

    expect(key).toBeDefined();
    expect(found.homecoming.stage).toBe('waiting');
    expect(found.sara.portrait.texture).toBe('sara-friendly');
    expect(found.chaos.damagedObjects).toBe(0);
    expect(found.albumDiscovery).toBeNull();
    await changeLanguage(page, 'en');

    if (key) expect((await state(page)).sara.dialogueText).toContain(resolveText(key, 'en'));
    await page.keyboard.down('Space');
    await page.clock.runFor(100);
    await page.keyboard.up('Space');
    expect((await state(page)).result).toBeNull();
    await until(
      page,
      (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
      500,
    );
    expect((await state(page)).homecoming.selection).toMatchObject({
      peaceful: true,
      dialogue: line,
      score: 0,
    });
    await page.keyboard.down('Space');
    await until(page, (s) => s.result !== null);
    await expect(page.locator('.album-banner')).toHaveAttribute(
      'data-entry',
      'achievement.rooms-normal-v1',
    );
    expect((await state(page)).feedback.text).toContain('Ball found. Everything in one piece.');
    await page.clock.runFor(3000);
    const ended = await state(page);

    expect(ended.reconciliation.stage).toBe('waiting');
    expect(ended.ending).toMatchObject({ kind: 'head', complete: true });
    expect(ended.sara).toMatchObject({ texture: 'sara-ending', frame: 11 });
    expect(ended.result).toMatchObject({
      peaceful: true,
      outcome: 'success',
      required: 0,
      hearts: 0,
      difficulty: 'normal',
      headlineText: 'Just a lovely day!',
    });
    expect(ended.generation).toBe(found.generation);
    await test
      .info()
      .attach('peaceful-desktop', { body: await page.screenshot(), contentType: 'image/png' });
    await page.keyboard.up('Space');
    await page.locator('.room-selection-return').click();
    await until(page, (s) => s.generation > found.generation);
    await expect(page.locator('.room-selection')).toBeVisible();
    expect((await state(page)).result).toBeNull();
    expect((await state(page)).chaos.score).toBe(0);
    await page.locator('[data-room-start]').click();
    await page.keyboard.down('Space');
    await until(page, (s) => s.started);
    await page.keyboard.up('Space');
    await climbToBall(page);
    await until(page, (s) => s.ballPlay.active);
    expect((await state(page)).sara.dialogueText).not.toContain(resolveText(key!, 'en'));
  },
);

test('Schon ein Kratzen vor dem Ziel behält den regulären Versöhnungsablauf', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Ein echtes Schadensereignis vor dem regulär erreichten Ball muss den neuen Sonderpfad ausschließen.
}) => {
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  await climbToBall(page);
  await until(page, (s) => s.ballPlay.active);
  expect((await state(page)).sara.visible).toBe(false);
  await until(
    page,
    (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
    500,
  );
  expect((await state(page)).homecoming.selection?.peaceful).toBe(false);
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'reading');
  await page.keyboard.up('Space');
  expect((await state(page)).result).toBeNull();
});

test('Schwer ohne Schäden feiert Raumabschluss und Sanfte Pfoten auch ohne Speichern', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echter Schwer-Abschluss prüft beide Banner und die unveränderte Speicherwahl gemeinsam.
}) => {
  await page.addInitScript(() => localStorage.setItem('pixels-world.difficulty', 'hard'));
  await start(page);
  await climbToBall(page);
  await until(
    page,
    (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
    500,
  );
  await page.keyboard.down('Space');
  await until(page, (s) => s.result !== null);
  await page.keyboard.up('Space');
  const banner = page.locator('.album-banner');

  await expect(banner).toHaveAttribute('data-entry', 'achievement.rooms-hard-v1');
  expect((await state(page)).chaos.damagedObjects).toBe(0);
  await page.clock.runFor(3100);
  await expect(banner).toHaveAttribute('data-entry', 'achievement.peaceful-living-room-v1');
  await expect(banner).toContainText('Sanfte Pfoten');
  expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
  await test
    .info()
    .attach('sanfte-pfoten-desktop', { body: await page.screenshot(), contentType: 'image/png' });
});
