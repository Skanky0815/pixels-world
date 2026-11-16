/* eslint-disable max-lines-per-function -- Echte Runden prüfen Greifen, Timer-Heimkehr und Neustart ohne Zustandssetter als einen Ablauf. */
import { test, expect, waitForGame } from '../support/support';
import { openPause } from '../support/pause-support';
import { observe, until, move, climbToCounterLanding } from './kitchen-support';

for (const kind of ['curtain', 'tablecloth', 'fridge'] as const)
  test(`${kind}: Heimkehr löst den aktiven Griff und Neue Runde startet frei @smoke`, async ({
    page,
  }) => {
    await page.goto(
      `/play.html?room=${kind === 'curtain' ? 'living-room' : 'kitchen'}&camera=room&room-seed=pantry-easy-12`,
    );
    await waitForGame(page);
    await move(page, ['Space'], (s) => s.started && s.pixel.grounded);

    if (kind === 'curtain') await move(page, ['ArrowRight'], (s) => s.pixel.x >= 790);
    else if (kind === 'tablecloth') await move(page, ['ArrowRight'], (s) => s.pixel.x >= 580);
    else {
      await climbToCounterLanding(page);
      await move(page, ['ArrowLeft'], (s) => s.pixel.left <= 769);
    }

    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.velocityX) < 1);
    const before = await observe(page);
    const target = before.round.returnAtMs - 800;

    await page.clock.runFor(Math.max(0, target - before.round.elapsedMs));
    await until(page, (s) => s.round.elapsedMs >= target);
    const keys = kind === 'tablecloth' ? ['Space', 'ArrowUp'] : ['ArrowUp'];

    try {
      for (const key of keys) await page.keyboard.down(key);
      await until(page, (s) => s.pixel.climbing);
      expect((await observe(page)).homecoming.stage).toBe('waiting');
      await until(page, (s) => s.homecoming.stage !== 'waiting');
    } finally {
      for (const key of keys) await page.keyboard.up(key);
    }

    await until(page, (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue');
    expect((await observe(page)).pixel.climbing).toBe(false);
    expect((await observe(page)).pixel.visible).toBe(true);
    await openPause(page);
    await page.getByRole('button', { name: 'Neue Runde', exact: true }).click();
    await page.locator('[data-menu-confirm]').click();
    await until(page, (s) => s.generation > before.generation && s.pixel.grounded);
    expect((await observe(page)).pixel.climbing).toBe(false);
    expect((await observe(page)).chaos.score).toBe(0);
  });
