export const VASE_APPEARANCES = ['terracotta', 'blue', 'gold', 'mellow'] as const;
export type VaseAppearance = (typeof VASE_APPEARANCES)[number];
export const VASE_SHARD_FAMILY = {
  terracotta: 'terracotta',
  blue: 'blue',
  gold: 'gold',
  mellow: 'terracotta',
} as const;

export function isVaseAppearance(value: unknown): value is VaseAppearance {
  return VASE_APPEARANCES.some((appearance) => appearance === value);
}
