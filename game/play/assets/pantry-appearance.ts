export const PANTRY_PROFILES = {
  'pen-cup': {
    width:28,height:42,mass:1.2,breakPower:180,breakSpeed:180,texture:'study-pen-cup',
    end:{state:'opened',event:'spill',texture:'study-pen-cup-spilled',width:88,height:26,shards:0},
  },
  jar: {
    width: 28,
    height: 34,
    mass: 1.3,
    breakPower: 260,
    breakSpeed: 180,
    texture: 'pantry-jar',
    shardTexture: 'pantry-glass-shard',
    end: {
      state: 'broken',
      event: 'break',
      texture: 'pantry-jar-broken',
      width: 76,
      height: 24,
      shards: 7,
    },
  },
  tin: {
    width: 32,
    height: 28,
    mass: 1.5,
    breakPower: 180,
    breakSpeed: 180,
    texture: 'pantry-tin',
    end: {
      state: 'opened',
      event: 'spill',
      texture: 'pantry-tin-opened',
      width: 84,
      height: 32,
      shards: 0,
    },
  },
} as const;
export type PantryAppearance = keyof typeof PANTRY_PROFILES;
export function isPantryAppearance(value: unknown): value is PantryAppearance {
  return value === 'jar' || value === 'tin' || value === 'pen-cup';
}
