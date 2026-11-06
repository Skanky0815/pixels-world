import type { CDPSession, Page } from '@playwright/test';
import { expect, loadIntro, until } from './support';
import type { ControlAction } from '../../src/game/input/pointer-actions';

type Finger = { id: number; x: number; y: number };

/** Browser input protocol only: no engine access or writable test observer. */
export class TouchDriver {
  private readonly fingers = new Map<number, Finger>();
  private readonly page: Page;
  private readonly session: CDPSession;

  constructor(page: Page, session: CDPSession) {
    this.page = page;
    this.session = session;
  }

  static async create(page: Page) {
    return new TouchDriver(page, await page.context().newCDPSession(page));
  }

  async press(action: ControlAction, id = 1) {
    const button = this.page.locator(`[data-control="${action}"]`);

    await button.scrollIntoViewIfNeeded();
    const rect = await button.boundingBox();

    expect(rect).not.toBeNull();

    if (!rect) throw new Error('Touch-Ziel fehlt');
    this.fingers.set(id, { id, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    await this.send('touchStart');
  }

  async lift(id = 1) {
    const finger = this.fingers.get(id);

    if (finger)
      await this.session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [finger],
      });
    this.fingers.delete(id);
  }

  async tap(action: ControlAction) {
    await this.press(action, 99);
    await this.lift(99);
  }

  async move(id: number, x: number, y: number) {
    this.fingers.set(id, { id, x, y });
    await this.send('touchMove');
  }

  async cancel() {
    this.fingers.clear();
    await this.send('touchCancel');
  }

  private async send(type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel') {
    await this.session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: [...this.fingers.values()],
    });
  }
}

export async function startTouch(page: Page, path = '/') {
  await loadIntro(page, path);
  const touch = await TouchDriver.create(page);

  await touch.tap('jump');
  await until(page, (s) => s.started && s.pixel.grounded);

  return touch;
}
