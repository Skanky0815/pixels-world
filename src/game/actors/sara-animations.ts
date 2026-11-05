import { SARA_ANIMATIONS } from '../../content/sara-reactions.ts';

export const SARA_SPRITE = {
  frameWidth: 64,
  frameHeight: 96,
  columns: 6,
  scale: 2,
  origin: { x: 0.5, y: 90 / 96 },
} as const;

export const SARA_CLIPS = {
  [SARA_ANIMATIONS.idle]: { frames: [0, 0, 1, 0], frameRate: 2, repeat: -1 },
  [SARA_ANIMATIONS.enter]: { frames: [2, 3, 4, 5], frameRate: 7, repeat: -1 },
  [SARA_ANIMATIONS.calm]: { frames: [6, 7], frameRate: 3, repeat: 0 },
  [SARA_ANIMATIONS.annoyed]: { frames: [8, 9], frameRate: 3, repeat: 0 },
  [SARA_ANIMATIONS.angry]: { frames: [10, 11], frameRate: 3, repeat: 0 },
} as const;
