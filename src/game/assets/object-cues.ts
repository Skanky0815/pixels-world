import type { DamageKind } from '../domain/chaos-event.ts';

export const OBJECT_CUES = ['vase', 'picture', 'books', 'creak', 'collapse'] as const;
export type ObjectCue = (typeof OBJECT_CUES)[number];
export const CUE_VOLUME: Record<ObjectCue, number> = {
  vase: 0.55,
  picture: 0.5,
  books: 0.65,
  creak: 0.4,
  collapse: 0.65,
};
const DAMAGE_CUES: Partial<Record<DamageKind, ObjectCue>> = {
  break: 'vase',
  'picture-fall': 'picture',
  topple: 'books',
  'shelf-damage': 'creak',
  collapse: 'collapse',
};

export function damageCue(kind: DamageKind): ObjectCue | undefined {
  return DAMAGE_CUES[kind];
}
