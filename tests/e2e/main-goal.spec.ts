import { DIFFICULTIES } from '../../src/content/difficulty';
import { startDifficulty } from './difficulty-support';
import { test, expect, state, holdUntil, until, reset } from './support';

for (const difficulty of DIFFICULTIES) {
  for (const room of ['living-room', 'cozy-remix']) {
    test(`Hauptziel ${difficulty} im ${room} ist ohne Schaden erreichbar und holt Sara vorzeitig heim`, async ({
      page,
      // eslint-disable-next-line max-lines-per-function -- Der echte schadenfreie Weg, Zielabschluss und Neustart sind ein zusammenhängender Erreichbarkeitsnachweis.
    }) => {
      await startDifficulty(page, difficulty, room === 'living-room' ? '/' : '/?room=cozy-remix');
      await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
      await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 116);
      await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 835);
      await holdUntil(
        page,
        ['ArrowDown'],
        (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2,
      );
      const onShelf = await state(page);

      expect(onShelf.chaos.score).toBe(0);
      expect(onShelf.goal.status).toBe('active');
      expect(onShelf.goalView).toMatchObject({
        ballTexture: 'favorite-ball',
        ballVisible: true,
        markerVisible: difficulty !== 'hard',
      });
      expect(onShelf.round.phase).toBe('chaos');
      expect(onShelf.goalView.markerWidth).toBe({ easy: 36, normal: 22, hard: 0 }[difficulty]);
      await test
        .info()
        .attach('ziel-aktiv', { body: await page.screenshot(), contentType: 'image/png' });

      if (room === 'living-room') {
        await page.clock.runFor(300);
        expect((await state(page)).goal.progress).toBeGreaterThan(0);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        const paused = await state(page);

        await page.clock.runFor(2000);
        expect((await state(page)).goal).toEqual(paused.goal);
        expect((await state(page)).round).toEqual(paused.round);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.keyboard.down('ArrowLeft');
        await until(page, (s) => s.goal.progress === 0);
        await page.keyboard.up('ArrowLeft');
      }

      await until(page, (s) => s.goal.status === 'reached');
      const reached = await state(page);

      expect(reached.round.endReason).toBe('goal');
      expect(reached.round.elapsedMs).toBeLessThan(reached.round.returnAtMs);
      expect(reached.round.finalChaosScore).toBe(0);
      expect(reached.homecoming.selection?.score).toBe(0);
      expect(reached.goalView.text).toContain('Ziel erreicht');
      expect(reached.goalView).toMatchObject({ ballVisible: true, markerVisible: false });
      await until(
        page,
        (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
        500,
      );
      await test
        .info()
        .attach('ziel-erreicht', { body: await page.screenshot(), contentType: 'image/png' });
      await reset(page);
      expect((await state(page)).goal).toMatchObject({ status: 'active', progress: 0 });
      expect((await state(page)).goalView).toMatchObject({
        ballVisible: true,
        markerVisible: difficulty !== 'hard',
      });
      expect((await state(page)).round.endReason).toBeNull();
      expect((await state(page)).result).toBeNull();
    });
  }
}
