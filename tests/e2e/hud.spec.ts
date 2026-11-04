import { test, expect, state, start, until, reset, besideCouch } from './support';

test('HUD zeigt echten Spielzustand und bleibt bei wiederholtem Reset unverändert aufgebaut', async ({ page }) => {
  await start(page);
  const idle = (await state(page)).hud;
  expect(idle).toEqual({
    statusText: 'PIXEL · HOME ALONE',
    scoreText: 'CHAOS: 0  ·  SARAS ÄRGER (VORSCHAU): Entspannt',
    climbHintText: '↑ KLETTERN\nLOSLASSEN: RUTSCHEN',
    climbHintAlpha: 0.65, angerRatio: 0, angerColor: 0x718463, elements: 4,
  });
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.hud))).toBe(true);
  for (let round = 0; round < 3; round++) {
    await besideCouch(page);
    await until(page, s => s.couch.damage === 1);
    const scratched = (await state(page)).hud;
    expect(scratched.statusText).toBe('PIXEL · SOFA KRATZEN');
    expect(scratched.scoreText).toBe('CHAOS: 3  ·  SARAS ÄRGER (VORSCHAU): Entspannt');
    expect(scratched.angerRatio).toBeCloseTo(3 / 162);
    await reset(page);
    expect((await state(page)).hud).toEqual(idle);
  }
});
