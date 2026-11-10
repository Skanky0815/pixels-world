import type { Page } from '@playwright/test';
import { state, until } from './support';
import { useIdleFrames, advanceRoundTo } from './round-clock';

const arrows = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

async function press(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.clock.runFor(100);
  await page.keyboard.up(key);
}

/** Reach the actual result through the normal homecoming and minigame inputs. */
// eslint-disable-next-line max-lines-per-function -- Vollständiger Rundenabschluss verwendet ausschließlich Browser-Uhr, echte Tasten und unveränderliche Beobachtung.
export async function finishAlbumRound(page: Page, success = false) {
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated',
    500,
  );
  await press(page, 'Space');

  for (let index = 0; index < 64; index++) {
    const snapshot = await state(page);

    if (snapshot.result) return snapshot.result;

    if (snapshot.reconciliation.stage === 'reading' || snapshot.reconciliation.stage === 'feedback')
      await press(page, 'Space');
    await until(page, (s) => s.reconciliation.stage === 'input' || s.result !== null, 100);
    const current = await state(page);

    if (current.result) return current.result;
    await press(page, answerKey(current.reconciliation.expected, success));
  }

  throw new Error('Round did not reach a result');
}

function answerKey(expected: keyof typeof arrows | null, success: boolean) {
  if (!expected) throw new Error('Expected minigame arrow');

  return success ? arrows[expected] : expected === 'left' ? 'ArrowRight' : 'ArrowLeft';
}
