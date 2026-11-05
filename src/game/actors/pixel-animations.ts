export const PIXEL_ANIMATIONS = {
  idle: { scale: 2, frames: [0, 1, 0, 2, 0, 0], frameRate: 3, repeat: -1 },
  walk: { scale: 2, frames: [5, 6, 7, 8, 9], frameRate: 10, repeat: -1 },
  jump: { scale: 94 / 32, frames: [10], frameRate: 6, repeat: -1 },
  apex: { scale: 94 / 32, frames: [11], frameRate: 6, repeat: -1 },
  fall: { scale: 94 / 32, frames: [12], frameRate: 6, repeat: -1 },
  land: { scale: 94 / 32, frames: [13, 14], frameRate: 14, repeat: 0 },
  climb: { scale: 2.5, frames: [15, 16, 17, 18], frameRate: 7, repeat: -1 },
  slide: { scale: 2.5, frames: [19], frameRate: 6, repeat: -1 },
  scratch: { scale: 2.5, frames: [20, 21, 22], frameRate: 8, repeat: -1 },
  nibble: { scale: 2.5, frames: [23, 24], frameRate: 6, repeat: -1 },
} as const;

interface AnimationState {
  climbing: boolean;
  sliding: boolean;
  grounded: boolean;
  velocityX: number;
  velocityY: number;
  scratching: boolean;
  nibbling: boolean;
  landing: boolean;
}

/** Animation follows gameplay state; it never changes movement or interaction timers. */
export function pixelAnimation(state: AnimationState): keyof typeof PIXEL_ANIMATIONS {
  if (state.climbing) return state.sliding ? 'slide' : 'climb';

  if (!state.grounded || state.velocityY < -1) {
    return airborneAnimation(state.velocityY);
  }

  return groundedAnimation(state);
}

function groundedAnimation(state: AnimationState): keyof typeof PIXEL_ANIMATIONS {
  if (state.nibbling) return 'nibble';

  if (state.scratching) return 'scratch';

  if (Math.abs(state.velocityX) > 1) return 'walk';

  return state.landing ? 'land' : 'idle';
}

function airborneAnimation(velocityY: number) {
  return velocityY < -60 ? 'jump' : velocityY > 60 ? 'fall' : 'apex';
}
