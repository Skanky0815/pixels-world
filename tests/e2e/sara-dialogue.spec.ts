import { test, expect, start, until, state, reset } from './support';
import { advanceRoundTo, useIdleFrames } from './round-clock';
import { changeLanguage } from './pause-support';
import { SARA_ROOM_DIALOGUE } from '../../src/content/sara-reactions';
import { de } from '../../src/i18n/de';
import { en } from '../../src/i18n/en';
import type { Page } from '@playwright/test';

async function waitForDialogue(page: Page) {
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
    500,
  );

  return state(page);
}

for (const room of ['living-room', 'cozy-remix'] as const) {
  // eslint-disable-next-line max-lines-per-function -- Desktop-Wohnzimmer und schmale Touch-Leseecke teilen denselben vollständigen Runden- und Sprachvertrag.
  test.describe(`Saras Dialog im ${room}`, () => {
    if (room === 'cozy-remix')
      test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test(
      'Raumkontext, Lesepause, Sprachwechsel und neue Variante nach Neustart',
      { tag: room === 'living-room' ? ['@smoke'] : [] },
      async ({
        page,
        // eslint-disable-next-line max-lines-per-function -- Zwei echte Runden sichern die Erinnerung über Szenenabbau sowie die unveränderte Dialogsteuerung ab.
      }) => {
        // Two full rounds also run with production durations in release QA.
        test.setTimeout(120_000);
        // High samples select room-specific lines; varying entropy also keeps Phaser UUIDs unique.
        await page.addInitScript(() => {
          let seed = 132;

          Math.random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;

            return 0.75 + 0.25 * (seed / 4294967296);
          };
        });
        await start(page, `/?room=${room}&round-profile=fast`);
        await useIdleFrames(page);
        const first = await waitForDialogue(page);
        const selected = first.homecoming.selection;

        expect(selected).not.toBeNull();
        expect(selected?.anger).toBe('calm');
        expect(SARA_ROOM_DIALOGUE[room].calm).toContain(selected?.dialogue);
        await page.clock.runFor(3000);
        expect((await state(page)).homecoming).toEqual(first.homecoming);
        await changeLanguage(page, 'en');
        await page.clock.runFor(100);
        const key = (Object.keys(de) as (keyof typeof de)[]).find(
          (key) => de[key] === selected?.dialogue,
        );

        expect(key).toBeDefined();

        if (!key) throw new Error('Dialogübersetzung fehlt');
        expect((await state(page)).sara.dialogueText).toContain(en[key]);
        expect((await state(page)).homecoming.selection).toEqual(selected);
        await test
          .info()
          .attach('raumdialog-en', { body: await page.screenshot(), contentType: 'image/png' });
        await changeLanguage(page, 'de');
        await reset(page);
        const second = await waitForDialogue(page);

        expect(second.homecoming.selection?.anger).toBe('calm');
        expect(second.homecoming.selection?.dialogue).not.toBe(selected?.dialogue);
        expect(SARA_ROOM_DIALOGUE[room].calm).toContain(second.homecoming.selection?.dialogue);
        expect(second.round.finalChaosScore).toBe(0);
        await page.keyboard.down('Space');
        await until(page, (s) => s.homecoming.stage === 'complete', 100);
        await page.keyboard.up('Space');
      },
    );
  });
}
