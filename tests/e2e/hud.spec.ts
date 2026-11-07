import { test, expect, state, start, until, reset, besideCouch } from './support';

test('HUD zeigt echten Spielzustand und bleibt bei wiederholtem Reset unverändert aufgebaut', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  const idle = (await state(page)).hud;

  expect(idle).toEqual({
    scoreText: 'CHAOS: 0',
    climbHintText: '↑ KLETTERN\nLOSLASSEN: RUTSCHEN',
    climbHintAlpha: 0.65,
    elements: 2,
  });
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.hud))).toBe(true);

  for (let round = 0; round < 3; round++) {
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    const scratched = (await state(page)).hud;

    expect(scratched.scoreText).toBe('CHAOS: 3');
    await reset(page);
    expect((await state(page)).hud).toEqual(idle);
  }
});
