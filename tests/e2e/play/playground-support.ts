import { expect } from '../support/support';
import type { Page } from '@playwright/test';
import type { PlaygroundScene } from '../../../game/dev/PlaygroundScene';

export type Snapshot = ReturnType<PlaygroundScene['snapshot']>;

export async function snapshot(page: Page): Promise<Snapshot> {
  return JSON.parse((await page.locator('#playground-diagnostics').textContent()) ?? '{}');
}

// eslint-disable-next-line max-lines-per-function -- Clock und lesbare DOM-Diagnose bilden eine gemeinsame Polling-Grenze.
export async function untilPlayground(page: Page, check: (state: Snapshot) => boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return check(await snapshot(page));
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toBe(true);
}

// eslint-disable-next-line max-lines-per-function -- Wie beim Spielstart muss die angehaltene Browseruhr bis zum ersten echten Szenen-Snapshot vorrücken.
export async function waitForDevReady(page: Page, attribute: string) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return page.locator('html').getAttribute(attribute);
      },
      { intervals: [0], timeout: 15000 },
    )
    .toBe('true');
}

// eslint-disable-next-line max-lines-per-function -- Gehaltene echte Eingaben werden auch bei fehlgeschlagener Zustandsbeobachtung vollständig freigegeben.
export async function movePlayground(
  page: Page,
  keys: string[],
  check: (state: Snapshot) => boolean,
) {
  try {
    for (const key of keys) await page.keyboard.down(key);
    await untilPlayground(page, check);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}
