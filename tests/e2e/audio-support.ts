import type { Page } from '@playwright/test';
import { expect } from './support';

/** Observe the browser audio boundary, without accessing Phaser or changing game state. */
// eslint-disable-next-line max-lines-per-function -- Die Browserinstrumentierung bleibt innerhalb eines einzelnen Init-Scripts.
export async function recordAudio(page: Page) {
  // eslint-disable-next-line max-lines-per-function -- Der komplette Source-Lebenszyklus wird innerhalb der isolierten Browsergrenze instrumentiert.
  await page.addInitScript(() => {
    const starts: number[] = [];
    const original = AudioBufferSourceNode.prototype.start;
    const stop = AudioBufferSourceNode.prototype.stop;
    const active = new Set<AudioBufferSourceNode>();

    Object.defineProperty(window, '__audioStarts', { value: starts });
    Object.defineProperty(window, '__audioActive', {
      get: () => [...active].map((source) => source.buffer?.duration ?? 0),
    });
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 0.1) starts.push(this.buffer.duration);

      active.add(this);
      this.addEventListener('ended', () => active.delete(this), { once: true });

      return original.apply(this, args);
    };

    AudioBufferSourceNode.prototype.stop = function (...args) {
      active.delete(this);

      return stop.apply(this, args);
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

export async function expectActiveAudio(page: Page, duration: number, playing: boolean) {
  await expect
    .poll(() =>
      page.evaluate((length) => {
        const active = (window as unknown as { __audioActive: number[] }).__audioActive;

        return active.some((value) => Math.abs(value - length) < 0.001);
      }, duration),
    )
    .toBe(playing);
}
