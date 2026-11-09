import type { Page } from '@playwright/test';
import { expect } from './support';

/** Observe the browser audio boundary, without accessing Phaser or changing game state. */
// eslint-disable-next-line max-lines-per-function -- Die Browserinstrumentierung bleibt innerhalb eines einzelnen Init-Scripts.
export async function recordAudio(page: Page) {
  await page.addInitScript(() => {
    const starts: number[] = [];
    const original = AudioBufferSourceNode.prototype.start;

    Object.defineProperty(window, '__audioStarts', { value: starts });
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 0.1) starts.push(this.buffer.duration);

      return original.apply(this, args);
    };
  });
}

export async function audioCount(page: Page, duration: number) {
  return page.evaluate((length) => {
    const starts = (window as unknown as { __audioStarts: number[] }).__audioStarts;

    return starts.filter((value) => Math.abs(value - length) < 0.001).length;
  }, duration);
}

export async function expectAudio(page: Page, duration: number, count: number) {
  await expect.poll(() => audioCount(page, duration)).toBe(count);
}
