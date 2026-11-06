import { test, expect, state, start, until, reset, besideCouch } from './support';

test('HUD zeigt echten Spielzustand und bleibt bei wiederholtem Reset unverändert aufgebaut', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  const idle = (await state(page)).hud;

  expect(idle).toEqual({
    roundText: 'Noch etwas Zeit',
    statusText: 'PIXEL · ALLEIN ZU HAUSE',
    scoreText: 'CHAOS: 0  ·  SARAS ÄRGER (VORSCHAU): Entspannt',
    climbHintText: '↑ KLETTERN\nLOSLASSEN: RUTSCHEN',
    climbHintAlpha: 0.65,
    angerRatio: 0,
    angerColor: 0x718463,
    elements: 5,
  });
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.hud))).toBe(true);

  for (let round = 0; round < 3; round++) {
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    const scratched = (await state(page)).hud;

    expect(scratched.statusText).toBe('PIXEL · SOFA KRATZEN');
    expect(scratched.scoreText).toBe('CHAOS: 3  ·  SARAS ÄRGER (VORSCHAU): Entspannt');
    expect(scratched.angerRatio).toBeCloseTo(3 / 162);
    await reset(page);
    expect((await state(page)).hud).toEqual(idle);
  }
});
