/* eslint-disable max-lines-per-function -- Die echten Greif-, Richtungs-, Pause- und Resetfolgen bleiben als ein zusammenhängender Bewegungsablauf sichtbar. */
import { test, expect } from '../support/support';
import {
  loadScenario,
  start,
  move,
  until,
  observe,
  togglePause,
  resume,
  reset,
} from './playground-object-support';
import { recordAudio, expectActiveAudio } from './audio-support';

test('Vorhang greift beim seitlichen Anspringen weiterhin automatisch ohne ↑ @smoke', async ({
  page,
}) => {
  await start(page);
  await move(page, ['ArrowRight'], (s) => s.pixel.x >= 790);
  await move(page, ['Space', 'ArrowRight'], (s) => s.pixel.climbing);
  expect((await observe(page)).pixel).toMatchObject({
    climbing: true,
    gravity: false,
    animation: 'slide',
  });
  await move(page, ['Space', 'ArrowLeft'], (s) => !s.pixel.climbing);
  expect((await observe(page)).pixel.gravity).toBe(true);
});

for (const [kind, recipe, speed] of [
  ['tablecloth', 'cloth-chain', 16],
  ['fridge', 'fridge-right', 100],
] as const)
  test(`${kind}: explizites Greifen, Aufstieg, Rutschen und Abstieg haben passende Pose und Audio @smoke`, async ({
    page,
  }) => {
    await recordAudio(page);
    await loadScenario(page, recipe);

    if (kind === 'tablecloth') await move(page, ['ArrowRight'], (s) => s.pixel.x >= 580);
    else await move(page, ['ArrowLeft'], (s) => s.pixel.left <= 1201);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.velocityX) < 1);
    expect((await observe(page)).pixel.climbing).toBe(false);
    await move(page, ['Space'], (s) => s.pixel.top < 360);
    expect((await observe(page)).pixel.climbing).toBe(false);
    await page.keyboard.down('ArrowUp');

    try {
      await until(page, (s) => s.pixel.climbing);
      await expectActiveAudio(page, 0.28, true);
      expect((await observe(page)).pixel).toMatchObject({ animation: 'climb', velocityY: -speed });
    } finally {
      await page.keyboard.up('ArrowUp');
    }

    await until(page, (s) => s.pixel.animation === 'slide');
    await expectActiveAudio(page, 0.4, true);
    await expectActiveAudio(page, 0.28, false);
    expect((await observe(page)).pixel.velocityY).toBe(35);
    await togglePause(page);
    const paused = await observe(page);

    await page.clock.runFor(400);
    expect((await observe(page)).pixel).toEqual(paused.pixel);
    await expectActiveAudio(page, 0.4, false);
    await resume(page);
    await page.keyboard.down('ArrowDown');

    try {
      await expectActiveAudio(page, 0.4, true);
      expect((await observe(page)).pixel).toMatchObject({ animation: 'slide', velocityY: 125 });
    } finally {
      await page.keyboard.up('ArrowDown');
    }

    await move(page, ['Space', 'ArrowRight'], (s) => !s.pixel.climbing);
    await expectActiveAudio(page, 0.4, false);
    await expectActiveAudio(page, 0.28, false);
    expect((await observe(page)).chaos.score).toBe(0);

    if (kind === 'fridge')
      expect((await observe(page)).shelves.find((s) => s.isFridge)?.fridge?.state).toBe('idle');
    await reset(page);
    expect((await observe(page)).pixel).toMatchObject({ climbing: false, grounded: true });
    expect((await observe(page)).chaos.score).toBe(0);
  });
