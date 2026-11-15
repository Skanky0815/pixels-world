import type { Bounds } from './contracts.ts';

/** Kinematic fall uses the same active deltas as plant damage; it never changes scores. */
export class PlantSupport {
  private elapsed = 0;
  private falling = false;
  private released = false;
  private y: number;
  private velocity = 0;
  private readonly duration: number;
  private readonly x: number;
  private readonly initial: Bounds;
  private readonly floor: Bounds;
  constructor(x: number, initial: Bounds, floor: Bounds) {
    this.x = x;
    this.initial = { ...initial };
    this.floor = { ...floor };
    this.y = initial.y;
    this.duration = Math.max(1, Math.sqrt((2 * Math.max(0, floor.y - initial.y)) / 1000) * 1000);
  }

  release(shelf: Bounds) {
    if (this.released || this.y >= this.floor.y || !onSupport(this.x, this.y, shelf)) return false;
    this.released = true;
    this.falling = true;

    return true;
  }

  advance(delta: number) {
    if (!this.falling) return;
    this.elapsed += Number.isFinite(delta) ? Math.max(0, delta) : 0;
    const fraction = Math.min(1, this.elapsed / this.duration);

    this.y = this.initial.y + (this.floor.y - this.initial.y) * fraction ** 2;
    this.velocity =
      fraction < 1 ? (2 * (this.floor.y - this.initial.y) * fraction * 1000) / this.duration : 0;
    this.falling = fraction < 1;
  }

  soil() {
    const b = this.released && !this.falling ? this.floor : this.initial;
    const width = Math.min(80, b.width);

    return {
      x: Math.max(b.x + width / 2, Math.min(this.x - 8, b.x + b.width - width / 2)),
      y: this.y + 1,
      width,
    };
  }

  snapshot() {
    return { y: this.y, dropping: this.falling, velocityY: this.velocity };
  }

  reset() {
    this.elapsed = 0;
    this.falling = false;
    this.released = false;
    this.y = this.initial.y;
    this.velocity = 0;
  }
}

function onSupport(x: number, y: number, shelf: Bounds) {
  return Math.abs(y - shelf.y) <= 2 && x >= shelf.x && x <= shelf.x + shelf.width;
}
