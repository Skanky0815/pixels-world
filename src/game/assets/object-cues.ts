import type { DamageKind } from '../domain/chaos-event.ts';

export const OBJECT_CUES = [
  'vase',
  'picture',
  'books',
  'creak',
  'collapse',
  'jump',
  'hairball',
  'retch',
  'scratch',
  'nibble',
  'climb',
  'slide',
] as const;
export type ObjectCue = (typeof OBJECT_CUES)[number];
export const CUE_VOLUME: Record<ObjectCue, number> = {
  vase: 0.55,
  picture: 0.5,
  books: 0.65,
  creak: 0.4,
  collapse: 0.65,
  jump: 0.3,
  hairball: 0.45,
  retch: 0.4,
  scratch: 0.3,
  nibble: 0.3,
  climb: 0.25,
  slide: 0.3,
};
const DAMAGE_CUES: Partial<Record<DamageKind, ObjectCue>> = {
  break: 'vase',
  'picture-fall': 'picture',
  topple: 'books',
  'shelf-damage': 'creak',
  collapse: 'collapse',
  hairball: 'hairball',
};

export function damageCue(kind: DamageKind): ObjectCue | undefined {
  return DAMAGE_CUES[kind];
}

const ACTION_CUES: Partial<Record<string, ObjectCue>> = {
  scratching: 'scratch',
  nibbling: 'nibble',
  wobbling: 'nibble',
  retching: 'retch',
  climbing: 'climb',
  sliding: 'slide',
};

export function actionCue(action: string, moving: boolean): ObjectCue | undefined {
  if ((action === 'climbing' || action === 'sliding') && !moving) return;

  return ACTION_CUES[action];
}
