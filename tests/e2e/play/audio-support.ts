import type { Page } from '@playwright/test';
import { expect } from '../support/support';

/** Observe the browser audio boundary, without accessing Phaser or changing game state. */
// eslint-disable-next-line max-lines-per-function -- Die Browserinstrumentierung bleibt innerhalb eines einzelnen Init-Scripts.
export async function recordAudio(page: Page) {
  // eslint-disable-next-line max-lines-per-function -- Der komplette Source-Lebenszyklus wird innerhalb der isolierten Browsergrenze instrumentiert.
  await page.addInitScript(() => {
    const starts: number[] = [];
    const stops: number[] = [];
    const original = AudioBufferSourceNode.prototype.start;
    const stop = AudioBufferSourceNode.prototype.stop;
    const active = new Set<AudioBufferSourceNode>();

    Object.defineProperty(window, '__audioStarts', { value: starts });
    Object.defineProperty(window, '__audioStops', { value: stops });
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
      if (this.buffer && this.buffer.duration > 0.1) stops.push(this.buffer.duration);
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

// eslint-disable-next-line max-lines-per-function -- Auch asynchrone WebAudio-Starts brauchen innerhalb der begrenzten Prüfung laufende Browserzeit.
export async function expectAudio(page: Page, duration: number, count: number) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);

        return audioCount(page, duration);
      },
      { intervals: [0], timeout: 1500 },
    )
    .toBe(count);
}

async function audioStops(page: Page, duration: number) {
  return page.evaluate((length) => {
    const stops = (window as unknown as { __audioStops: number[] }).__audioStops;

    return stops.filter((value) => Math.abs(value - length) < 0.001).length;
  }, duration);
}

async function activeAudio(page: Page, duration: number) {
  return page.evaluate((length) => {
    const active = (window as unknown as { __audioActive: number[] }).__audioActive;

    return active.some((value) => Math.abs(value - length) < 0.001);
  }, duration);
}

// eslint-disable-next-line max-lines-per-function -- Die begrenzte Beobachtung lässt reale Spielzeit laufen und erkennt auch kurze Stopps oder unnötige Neustarts.
export async function expectActiveAudio(page: Page, duration: number, playing: boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);

        return activeAudio(page, duration);
      },
      { intervals: [0], timeout: 1500 },
    )
    .toBe(playing);
  const starts = await audioCount(page, duration);
  const stopped = await audioStops(page, duration);

  for (let frame = 0; frame < 6; frame++) {
    await page.clock.runFor(16);
    expect(await activeAudio(page, duration)).toBe(playing);
    expect(await audioStops(page, duration)).toBe(stopped);

    if (!playing) expect(await audioCount(page, duration)).toBe(starts);
  }
}

/** Emulates display cadence at the browser API, without changing physics or exposing the engine. */
export async function useRenderCadence(page: Page, intervalMs: number) {
  await page.addInitScript((interval) => {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => callback(performance.now()), interval);
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  }, intervalMs);
}
