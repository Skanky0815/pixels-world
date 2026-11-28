/* eslint-disable max-lines-per-function -- Reale Auswahl, Sprünge, Interaktionen und Abschluss prüfen die erste Arbeitszimmerroute. */
import { returnToMenu } from '../support/pause-support';
import type { Difficulty } from '../../../game/play/content/difficulty';
import { test, expect, waitForGame, introAction } from '../support/support';
import { observe, until, move } from './kitchen-support';
import type { Page } from '@playwright/test';

async function study(page: Page, difficulty: Difficulty = 'normal') {
  await page.goto('/play.html?camera=room');
  await waitForGame(page, false);
  await page.locator('[data-menu-play]').click();
  await page.locator('[data-room-choice="study"]').click();
  await page.locator('[data-room-start]').click();
  await until(page, (s) => s.room.id === 'study' && s.intro.visible);
  await (await introAction(page, 'options')).click();
  await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption(difficulty);
  await returnToMenu(page);
  await page.locator('[data-pause-resume]').click();
  await page.locator('#game').focus();
  await move(page, ['Space'], (s) => s.started && s.difficulty === difficulty);
  await until(page, (s) => s.pixel.grounded);
}

async function desk(page: Page) {
  await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 740);
  await move(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 400) < 2);
  await move(page, ['Space'], (s) => s.pixel.bottom <= 316);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 620);
  await move(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 320) < 2);
}

for (const difficulty of ['easy', 'normal', 'hard'] as const) {
  test(`Arbeitszimmer ${difficulty}: Eingang rechts, Fensterziel und friedliche Heimkehr`, async ({
    page,
  }) => {
    await study(page, difficulty);
    await page.locator('#game').screenshot({ path: test.info().outputPath('study-start.png') });
    await desk(page);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 520);
    await move(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 315);
    await move(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 222) < 2);
    await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 268);
    await move(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
    await until(page, (s) => s.goal.status === 'reached');
    expect((await observe(page)).chaos.damagedObjects).toBe(0);
    expect((await observe(page)).album.pending).toContain('goal.window-toy');
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    expect((await observe(page)).sara.fallbackDoorVisible).toBe(false);
    expect((await observe(page)).sara.x).toBeGreaterThan(800);
    await move(page, ['Space'], (s) => s.result !== null);
    expect((await observe(page)).result).toMatchObject({
      outcome: 'success',
      peaceful: true,
      goalReached: true,
    });
    expect((await observe(page)).album.confirmed).toContain('goal.window-toy');
  });
}

test('Arbeitszimmer: Papierstapel und Stiftebecher reagieren echt, Pause und Reset bleiben gemeinsam', async ({
  page,
}) => {
  await study(page);
  await desk(page);
  await move(page, ['ArrowLeft'], (s) => s.pixel.x <= 465);
  await move(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.books.some((b) => b.appearance === 'paper' && b.state === 'fallen'));
  expect((await observe(page)).books.find((b) => b.appearance === 'paper')?.events).toBe(1);
  await move(page, ['ArrowLeft'], (s) => s.pantry.some((p) => p.state === 'opened'));
  const damaged = await observe(page);

  expect(damaged.album.pending).toEqual(
    expect.arrayContaining(['books.paper', 'container.pencils']),
  );
  await page.locator('.pause-toggle').click();
  await page.clock.runFor(1000);
  expect((await observe(page)).chaos).toEqual(damaged.chaos);
  await page.locator('[data-pause-resume]').click();
  await page.locator('#game').focus();
  await move(page, ['r'], (s) => s.generation > damaged.generation);
  expect((await observe(page)).chaos.score).toBe(0);
  expect((await observe(page)).books.every((b) => b.events === 0)).toBe(true);
  expect((await observe(page)).pantry.every((p) => p.state === 'resting')).toBe(true);
});
