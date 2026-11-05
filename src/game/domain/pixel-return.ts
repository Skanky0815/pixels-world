import type { InputState } from '../input/input-state.ts';

export interface ReturnContact {
  readonly centerX: number;
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly grounded: boolean;
  readonly blocked: { readonly left: boolean; readonly right: boolean };
}
export interface ReturnPlatform {
  readonly left: number;
  readonly right: number;
  readonly top: number;
}
interface ReturnConfig {
  readonly width: number;
  readonly floorY: number;
  readonly targetX: number;
}
const STOPPED: InputState = Object.freeze({
  horizontal: 0,
  vertical: 0,
  jumpPressed: false,
  confirmPressed: false,
  resetPressed: false,
  active: false,
});

export type PixelReturnSnapshot = ReturnType<PixelReturnController['snapshot']>;

/** Automatic input for the normal actor/physics; never teleports or awards damage. */
export class PixelReturnController {
  private stage: 'waiting' | 'walking' | 'seated' = 'waiting';
  private exit: { x: number; top: number } | null = null;

  private readonly config: ReturnConfig;
  private readonly platforms: readonly ReturnPlatform[];

  constructor(config: ReturnConfig, platforms: readonly ReturnPlatform[]) {
    this.config = config;
    this.platforms = platforms;
  }

  start() {
    if (this.stage !== 'waiting') return false;
    this.stage = 'walking';

    return true;
  }

  input(contact: ReturnContact): InputState {
    if (this.stage !== 'walking' || this.settle(contact)) return STOPPED;
    this.followPlatformEdge(contact);
    const distance = (this.exit?.x ?? this.config.targetX) - contact.centerX;
    const horizontal = Math.max(-0.6, Math.min(0.6, distance / contact.width));

    return automaticInput(contact, horizontal);
  }

  private settle(contact: ReturnContact) {
    if (
      !onFloor(contact, this.config.floorY) ||
      Math.abs(contact.centerX - this.config.targetX) > 4
    )
      return false;
    this.stage = 'seated';
    this.exit = null;

    return true;
  }

  private followPlatformEdge(contact: ReturnContact) {
    if (this.exit && contact.bottom > this.exit.top + contact.height + 2) this.exit = null;

    if (this.exit || !contact.grounded || contact.bottom >= this.config.floorY - 2) return;
    const platform = this.platforms.find((candidate) => supports(candidate, contact));

    if (platform) this.exit = chooseExit(platform, contact, this.config);
  }

  snapshot() {
    return Object.freeze({
      stage: this.stage,
      targetX: this.config.targetX,
      floorY: this.config.floorY,
      waypointX: this.exit?.x ?? null,
    });
  }
}

function supports(platform: ReturnPlatform, contact: ReturnContact) {
  return (
    Math.abs(platform.top - contact.bottom) < 3 &&
    contact.left < platform.right &&
    contact.right > platform.left
  );
}

function chooseExit(platform: ReturnPlatform, contact: ReturnContact, config: ReturnConfig) {
  const margin = contact.width / 2 + 4;
  const candidates = [platform.left - margin, platform.right + margin]
    .filter((x) => x >= contact.width / 2 && x <= config.width - contact.width / 2)
    .sort((a, b) => Math.abs(a - config.targetX) - Math.abs(b - config.targetX));
  const x = candidates[0];

  if (x === undefined) throw new Error('Platform has no reachable exit for Pixel');

  return { x, top: platform.top };
}

function onFloor(contact: ReturnContact, floorY: number) {
  return contact.grounded && Math.abs(contact.bottom - floorY) <= 2;
}

function automaticInput(contact: ReturnContact, horizontal: number): InputState {
  const blocked = horizontal < 0 ? contact.blocked.left : contact.blocked.right;

  return Object.freeze({
    ...STOPPED,
    horizontal,
    jumpPressed: contact.grounded && blocked,
    active: true,
  });
}
