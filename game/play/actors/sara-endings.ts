export const SARA_ENDING_SPRITE = { frameWidth: 96, frameHeight: 96, columns: 6 } as const;
export const SARA_ENDINGS = {
  head: {
    key: 'sara-ending-head',
    label: 'Versöhnt · Kopf streicheln',
    frames: [6, 7, 8, 9, 10, 9, 10, 11, 11, 11, 11, 11],
    frameRate: 4,
    gap: 60,
  },
  belly: {
    key: 'sara-ending-belly',
    label: 'Versöhnt · Bauch kraulen',
    frames: [0, 1, 2, 3, 4, 3, 4, 5, 5, 5, 5, 5],
    frameRate: 4,
    gap: 53,
  },
  sulk: {
    key: 'sara-ending-sulk',
    label: 'Nicht versöhnt · Sauer bleiben',
    frames: [12, 13, 14, 14, 15, 15, 15, 15, 15],
    frameRate: 3,
    gap: 64,
  },
} as const;
export type EndingKind = keyof typeof SARA_ENDINGS;
export type EndingAnimation = (typeof SARA_ENDINGS)[EndingKind]['key'];
