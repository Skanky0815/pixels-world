/* eslint-disable max-lines-per-function -- Reale Eingaben, Präferenzwechsel und physische Folgen werden gemeinsam an der öffentlichen Browsergrenze geprüft. */
import { test, expect, waitForLoadingScreen } from '../support/support';
import type { Page } from '@playwright/test';
import {
  loadScenario,
  start,
  lowerShelf,
  firstVase,
  observe,
  until,
  move,
  togglePause,
  resume,
  reset,
  type ObjectState,
} from './playground-object-support';

async function menuPreference(page: Page, reduced: boolean) {
  await page.goto('http://127.0.0.1:4176/play.html');
  await waitForLoadingScreen(page);
  await page.locator('[data-menu-settings]').click();
  await page
    .getByRole('checkbox', { name: 'Bewegung reduzieren', exact: true })
    .setChecked(reduced);
}

const lower = (s: ObjectState) => s.shelves.find((shelf) => shelf.id === 'lower-shelf')!;
const fragments = (s: ObjectState, kind: 'vase' | 'cup' | 'plate') =>
  kind === 'vase' ? s.vases : s.dishes;

async function shatter(page: Page, kind: 'vase' | 'cup' | 'plate') {
  if (kind === 'vase') {
    await start(page, '/?room-seed=vases');
    await firstVase(page);
  } else {
    await loadScenario(page, kind === 'cup' ? 'dish-cups' : 'dish-plates');
    await move(page, ['ArrowRight'], (s) => s.dishes[0].state === 'moving');
  }

  await until(page, (s) => fragments(s, kind).some((object) => object.state === 'falling'));
  const falling = fragments(await observe(page), kind).find(
    (object) => object.state === 'falling',
  )!;

  expect(falling.shards).toBe(0);
  expect(falling.bottom).toBeLessThan(468);
  await until(page, (s) => fragments(s, kind).some((object) => object.state === 'broken'));

  return fragments(await observe(page), kind).find((object) => object.state === 'broken')!.id;
}

for (const kind of ['vase', 'cup', 'plate'] as const)
  for (const source of ['system', 'menu'] as const)
    test(`${kind}: ${source} reduziert dekorative Splitter ohne den echten Fall oder Schaden zu überspringen @smoke`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });

      if (source === 'menu') await menuPreference(page, true);
      const id = await shatter(page, kind);
      const debris = (s: ObjectState) => fragments(s, kind).find((object) => object.id === id)!;
      const broken = await observe(page);

      expect(debris(broken).shards).toBe(7);
      expect(debris(broken).shardPositions.every((shard) => shard.angle === 0)).toBe(true);
      expect(new Set(debris(broken).shardPositions.map((shard) => shard.x)).size).toBeGreaterThan(
        1,
      );
      await page.clock.runFor(400);
      expect(debris(await observe(page)).shardPositions).toEqual(debris(broken).shardPositions);
      expect((await observe(page)).objects.find((object) => object.id === id)?.events).toBe(1);
      expect((await observe(page)).chaos.score).toBeGreaterThanOrEqual(debris(broken).points);
      await reset(page);
      expect(fragments(await observe(page), kind).every((object) => object.shards === 0)).toBe(
        true,
      );
    });

for (const source of ['system', 'menu'] as const)
  test(`Regal: ${source} erhält Warnung, Schaden und echten Einsturz ohne Wackeln @smoke`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    if (source === 'menu') await menuPreference(page, true);
    await start(page, '/?room-seed=shelves-172');
    await lowerShelf(page);
    await until(page, (s) => lower(s).state === 'wobbly');

    if (source === 'system') {
      await until(page, (s) => Math.abs(lower(s).angle) > 0.1);
      await togglePause(page);
      const paused = await observe(page);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await until(page, (s) => lower(s).angle === 0);
      await page.clock.runFor(500);
      expect((await observe(page)).pixel).toEqual(paused.pixel);
      expect(lower(await observe(page))).toMatchObject({
        state: 'wobbly',
        landings: 1,
        enabled: true,
        angle: 0,
      });
      await resume(page);
    }

    expect(lower(await observe(page)).angle).toBe(0);

    for (let landing = 2; landing <= 3; landing++) {
      await move(page, ['Space'], (s) => !s.pixel.grounded);
      await until(page, (s) => lower(s).landings === landing);
      expect(lower(await observe(page)).angle).toBe(0);
    }

    await until(page, (s) => lower(s).fallProgress > 0 && lower(s).fallProgress < 1);
    const falling = lower(await observe(page));

    expect(falling).toMatchObject({ state: 'collapsed', enabled: false, events: 2 });
    await page.clock.runFor(64);
    expect(lower(await observe(page)).y).toBeGreaterThan(falling.y);
    await until(page, (s) => lower(s).fallProgress === 1);
    await reset(page);
    expect(lower(await observe(page))).toMatchObject({
      state: 'intact',
      landings: 0,
      angle: 0,
      fallProgress: 0,
    });
  });

test('Umschalten während pausierter Splitterstreuung beendet nur Dekoration und spielt sie nicht nach', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await loadScenario(page, 'pantry-jars');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) =>
    s.pantry.some(
      (item) =>
        item.state === 'broken' && item.shardPositions.some((shard) => Math.abs(shard.angle) > 0.1),
    ),
  );
  const id = (await observe(page)).pantry.find((item) => item.state === 'broken')!.id;
  const item = (s: ObjectState) => s.pantry.find((object) => object.id === id)!;

  await togglePause(page);
  const paused = await observe(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await until(page, (s) => item(s).shardPositions.every((shard) => shard.angle === 0));
  const reduced = await observe(page);

  expect(item(reduced).contents?.width).toBe(76);
  expect(item(reduced).events).toBe(item(paused).events);
  expect(reduced.chaos).toEqual(paused.chaos);
  await page.clock.runFor(500);
  expect(item(await observe(page)).shardPositions).toEqual(item(reduced).shardPositions);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await resume(page);
  await page.clock.runFor(400);
  expect(item(await observe(page)).shardPositions).toEqual(item(reduced).shardPositions);
  await reset(page);
  expect(
    (await observe(page)).pantry.every((object) => object.shards === 0 && object.contents === null),
  ).toBe(true);
});

test('Reduzierte Bewegung beendet beim Auflagenverlust keinen tatsächlichen Inhaltsfall', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await loadScenario(page, 'pantry-open-support');
  await move(page, ['ArrowRight'], (s) => s.pantry[0].state === 'moving');
  await until(page, (s) => s.pantry[1].state === 'opened');
  await page.clock.runFor(400);
  expect((await observe(page)).pantry[1].contents?.y).toBe(300);

  for (let jump = 0; jump < 8 && (await observe(page)).shelves[0].enabled; jump++) {
    await move(page, ['Space'], (s) => !s.pixel.grounded);
    await until(page, (s) => s.pixel.grounded || !s.shelves[0].enabled);
  }

  await until(
    page,
    (s) => (s.pantry[1].contents?.y ?? 0) > 300 && (s.pantry[1].contents?.y ?? 468) < 468,
  );
  await togglePause(page);
  const falling = (await observe(page)).pantry[1].contents!.y;

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(200);
  expect((await observe(page)).pantry[1].contents?.y).toBe(falling);
  await resume(page);
  await until(page, (s) => s.pantry[1].contents?.y === 468);
  expect((await observe(page)).pantry[1].events).toBe(1);
});
