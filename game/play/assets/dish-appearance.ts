export const DISH_PROFILES = {
  cup: {
    width: 24,
    height: 26,
    mass: 0.8,
    breakSpeed: 160,
    breakPower: 220,
    texture: 'dish-cup',
    shardTexture: 'dish-shard',
  },
  plate: {
    width: 32,
    height: 10,
    mass: 1.1,
    breakSpeed: 180,
    breakPower: 240,
    texture: 'dish-plate',
    shardTexture: 'dish-shard',
  },
} as const;
export type DishAppearance = keyof typeof DISH_PROFILES;
export function isDishAppearance(value: unknown): value is DishAppearance {
  return value === 'cup' || value === 'plate';
}
