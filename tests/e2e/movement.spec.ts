import { recordAudio, expectAudio, expectActiveAudio } from './audio-support';
import {
  test,
  expect,
  state,
  start,
  until,
  holdUntil,
  lowerShelf,
  curtain,
  framesPass,
  reset,
} from './support';

test(
  'Pfeiltasten bewegen Pixel; Boden und Raumgrenze halten ihn auf',
  { tag: '@smoke' },
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
  async ({ page }) => {
    await start(page);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x > 150);
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.left <= 0.1);
    await framesPass(page);
    const { pixel } = await state(page);

    expect(pixel.x).toBeGreaterThanOrEqual(0);
    expect(pixel.grounded).toBe(true);
    expect(pixel.bottom).toBeCloseTo(468, 0);
    expect(pixel.velocityY).toBe(0);
  },
);

test('Tastatursprünge landen auf Sofa und erstem Regal', async ({ page }) => {
  await recordAudio(page);
  await start(page);
  await expectAudio(page, 0.16, 0);
  await lowerShelf(page);
  await expectAudio(page, 0.16, 2);
  expect((await state(page)).pixel.x).toBeLessThan(664);
});

test('Vorhang: hoch, langsam rutschen, herunter und abspringen mit Schwerkraft', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await recordAudio(page);
  await start(page);
  await curtain(page);
  await until(page, (s) => s.curtain.state === 'sliding');
  await until(page, (s) => s.pixel.velocityY > 0);
  await expectActiveAudio(page, 0.4, true);
  const slidingStart = await state(page);

  await framesPass(page);
  expect((await state(page)).pixel.y).toBeGreaterThan(slidingStart.pixel.y + 4);
  expect((await state(page)).pixel.y).toBeLessThan(slidingStart.pixel.y + 20);
  expect((await state(page)).pixel.gravity).toBe(false);
  await holdUntil(page, ['ArrowDown'], (s) => s.pixel.y > slidingStart.pixel.y + 35);
  await page.keyboard.down('ArrowLeft');

  try {
    await holdUntil(
      page,
      ['Space'],
      (s) => !s.pixel.climbing && s.pixel.gravity && s.pixel.velocityY < -100,
    );
    await until(page, (s) => s.pixel.velocityY > 50);
  } finally {
    await page.keyboard.up('ArrowLeft');
  }

  await expectActiveAudio(page, 0.4, false);
  await expectAudio(page, 0.16, 1);
  expect((await state(page)).pixel.x).toBeLessThan(slidingStart.pixel.x - 50);
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Sprung behält Schwung ohne Richtungstaste und erlaubt Luftsteuerung', async ({ page }) => {
  await start(page);
  // Test air momentum in the open floor area, away from the couch side.
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 460);
  await until(page, (s) => s.pixel.grounded && s.pixel.velocityX === 0);
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.y < 400 && s.pixel.velocityX > 200);
  const jumping = await state(page);

  await framesPass(page, 6);
  const drifting = await state(page);

  expect(drifting.pixel.grounded).toBe(false);
  expect(drifting.pixel.x).toBeGreaterThan(jumping.pixel.x + 12);
  expect(drifting.pixel.velocityX).toBeGreaterThan(200);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.velocityX < 0);
});

test('Vorhang wird beim Anspringen ohne Hoch/Runter automatisch gegriffen', async ({ page }) => {
  await start(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 680);
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.climbing);
  await until(page, (s) => s.curtain.state === 'sliding' && s.pixel.velocityX === 0);
  expect((await state(page)).pixel.velocityY).toBe(35);
  expect((await state(page)).pixel.gravity).toBe(false);
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Klettern kollidiert mit Regalunterseite und Boden', async ({ page }) => {
  await start(page);
  await curtain(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 826);
  // Die obere Plattform überragt den rechten Rand des versetzten Vorhangs.
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.top <= 172);
  await page.keyboard.down('ArrowUp');

  try {
    await framesPass(page, 20);
    const blocked = await state(page);

    expect(blocked.pixel.top).toBeGreaterThanOrEqual(169);
    expect(blocked.pixel.top).toBeLessThan(173);
    expect(blocked.pixel.climbing).toBe(true);
  } finally {
    await page.keyboard.up('ArrowUp');
  }

  await holdUntil(page, ['ArrowDown'], (s) => s.pixel.bottom >= 467);
  await page.keyboard.down('ArrowDown');

  try {
    await framesPass(page, 20);
    expect((await state(page)).pixel.bottom).toBeCloseTo(468, 0);
  } finally {
    await page.keyboard.up('ArrowDown');
  }
});

test('Pixel: bestätigter Idle, Blinzeln und seitlicher Laufzyklus in beiden Richtungen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await start(page);
  await until(page, (s) => s.pixel.animation === 'idle' && s.pixel.animationFrame === 0);
  expect((await state(page)).pixel.texture).toBe('pixel');
  await until(page, (s) => s.pixel.animationFrame === 2);
  await until(page, (s) => s.pixel.animationFrame === 0);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.animation === 'walk' && s.pixel.x > 145);
  expect((await state(page)).pixel.flipX).toBe(false);
  expect((await state(page)).pixel).toMatchObject({
    displayWidth: 64,
    displayHeight: 64,
    bodyWidth: 52,
    bodyHeight: 52,
  });
  await page.keyboard.down('ArrowRight');

  try {
    const frame = (await state(page)).pixel.animationFrame;

    await until(page, (s) => s.pixel.animationFrame !== frame);
    const screenshot = testInfo.outputPath('pixel-walking.png');

    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach('Pixel läuft im Raum', { path: screenshot, contentType: 'image/png' });
  } finally {
    await page.keyboard.up('ArrowRight');
  }

  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.animation === 'walk' && s.pixel.flipX);
  await reset(page);
  expect((await state(page)).pixel.animation).toBe('idle');
});

test('Pixel: Sprung, Scheitelpunkt, Fall, Landung und Klettern in Rückansicht', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await start(page);
  await holdUntil(page, ['Space'], (s) => s.pixel.animation === 'jump' && !s.pixel.grounded);
  expect((await state(page)).pixel).toMatchObject({
    displayWidth: 94,
    displayHeight: 94,
    bodyWidth: 52,
    bodyHeight: 52,
  });
  await until(page, (s) => s.pixel.animation === 'apex');
  await until(page, (s) => s.pixel.animation === 'fall');
  await until(page, (s) => s.pixel.animation === 'land' && s.pixel.grounded);
  await until(page, (s) => s.pixel.animation === 'idle');
  await curtain(page);
  await page.keyboard.down('ArrowUp');

  try {
    await until(page, (s) => s.pixel.animation === 'climb');
    const first = (await state(page)).pixel.animationFrame;

    await until(page, (s) => s.pixel.animationFrame !== first);
    expect((await state(page)).pixel.flipX).toBe(false);
    expect((await state(page)).pixel).toMatchObject({
      displayWidth: 80,
      displayHeight: 80,
      bodyWidth: 52,
      bodyHeight: 52,
    });
    const screenshot = testInfo.outputPath('pixel-climbing.png');

    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach('Pixel klettert in Rückansicht', {
      path: screenshot,
      contentType: 'image/png',
    });
  } finally {
    await page.keyboard.up('ArrowUp');
  }

  await until(page, (s) => s.pixel.animation === 'slide' && s.pixel.animationFrame === 19);
  await holdUntil(
    page,
    ['Space', 'ArrowLeft'],
    (s) => s.pixel.animation === 'jump' && !s.pixel.climbing,
  );
});
