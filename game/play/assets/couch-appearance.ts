export const COUCH_APPEARANCES = ['cozy', 'worn'] as const;
export type CouchAppearance = (typeof COUCH_APPEARANCES)[number];

export function isCouchAppearance(value: unknown): value is CouchAppearance {
  return COUCH_APPEARANCES.some((appearance) => appearance === value);
}
