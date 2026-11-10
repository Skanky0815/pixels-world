import {
  test,
  expect,
  start,
  until,
  state,
  reset,
  besideCouch,
  besidePlant,
  firstVase,
  holdUntil,
} from './support';
import { advanceRoundTo, useIdleFrames } from './round-clock';
import { SARA_DAMAGE_DIALOGUE } from '../../src/content/sara-reactions';
import { changeLanguage } from './pause-support';
import { startTouch } from './touch-support';
import { de } from '../../src/i18n/de';
import { en } from '../../src/i18n/en';
import type { Page } from '@playwright/test';

async function finishRound(page: Page) {
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
    500,
  );

  return state(page);
}

test(
  'Sofaschaden bestimmt den Dialog; Neustart entfernt den alten Vorfall',
  { tag: '@smoke' },
  async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Zwei echte Runden prüfen Sofaschaden, unveränderte Scorestufe und vollständiges Leeren des Kontextes.
  }) => {
    test.setTimeout(120_000);
    await start(page, '/?round-profile=fast');
    await besideCouch(page);
    await until(page, (s) => s.couch.damage > 0);
    const first = await finishRound(page);
    const selection = first.homecoming.selection;

    expect(selection?.damage).toMatchObject({
      topic: 'sofa',
      objectId: first.couch.lastDamage?.objectId,
    });
    expect(selection?.anger).toBe(first.chaos.anger);

    if (!selection) throw new Error('Saras Reaktion fehlt');
    expect(SARA_DAMAGE_DIALOGUE.sofa[selection.anger]).toContain(selection.dialogue);
    await page.clock.runFor(2000);
    expect((await state(page)).homecoming.selection).toEqual(selection);
    await reset(page);
    const second = await finishRound(page);

    expect(second.homecoming.selection?.damage).toBeNull();
    expect(second.round.finalChaosScore).toBe(0);
  },
);

// eslint-disable-next-line max-lines-per-function -- Die Gerätegruppe hält den echten Pflanzenvorfall und Sprachwechsel auf demselben schmalen Touch-Bildschirm zusammen.
test.describe('Pflanzenreaktion auf Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Umgekippter Topf liefert konkrete DE/EN-Zeile ohne Neuauswahl', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Reguläre Eingaben kippen die Pflanze; erst die echte Heimkehr darf den passenden Satz zeigen.
  }) => {
    test.setTimeout(90_000);
    await startTouch(page, '/?round-profile=fast');
    await besidePlant(page);
    await until(page, (s) => s.plant.state === 'tipped');
    const finished = await finishRound(page);
    const selection = finished.homecoming.selection;

    expect(selection?.damage?.topic).toBe('plant');

    if (!selection) throw new Error('Saras Reaktion fehlt');
    expect(SARA_DAMAGE_DIALOGUE.plant[selection.anger]).toContain(selection.dialogue);
    await changeLanguage(page, 'en');
    await page.clock.runFor(100);
    const key = (Object.keys(de) as (keyof typeof de)[]).find(
      (key) => de[key] === selection.dialogue,
    );

    if (!key) throw new Error('Übersetzung fehlt');
    expect((await state(page)).sara.dialogueText).toContain(en[key]);
    expect((await state(page)).homecoming.selection).toEqual(selection);
    await test.info().attach('pflanzenreaktion-touch-en', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});

test('Eingestürztes Regal hat auch bei späteren Vasenbrüchen Vorrang', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echte Sprünge, Kollaps und Kaskaden prüfen den priorisierten Kontext vor einer regulären Heimkehr.
}) => {
  // Includes the full room route and an unshortened round deadline.
  test.setTimeout(120_000);
  await start(page, '/?room-seed=shelves-172');
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 560);
  await until(page, (s) => s.pixel.grounded);

  for (const landing of [2, 3]) {
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(page, (s) => s.shelves[0].landings >= landing);
  }

  expect((await state(page)).shelves[0].state).toBe('collapsed');
  const finished = await finishRound(page);
  const selection = finished.homecoming.selection;

  expect(selection?.damage).toMatchObject({ topic: 'shelf', objectId: 'lower-shelf', stage: 2 });
  expect(selection?.score).toBe(finished.round.finalChaosScore);

  if (!selection) throw new Error('Saras Reaktion fehlt');
  expect(SARA_DAMAGE_DIALOGUE.shelf[selection.anger]).toContain(selection.dialogue);
  await test
    .info()
    .attach('regalreaktion', { body: await page.screenshot(), contentType: 'image/png' });
});
