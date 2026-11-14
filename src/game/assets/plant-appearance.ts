export const PLANT_APPEARANCES = ['catgrass', 'basil', 'parsley', 'mint'] as const;
export type PlantAppearance = (typeof PLANT_APPEARANCES)[number];
export function isPlantAppearance(value: unknown): value is PlantAppearance {
  return PLANT_APPEARANCES.includes(value as PlantAppearance);
}

export function plantTexture(appearance: PlantAppearance, bitten: boolean) {
  const prefix = appearance === 'catgrass' ? 'catgrass' : `herb-${appearance}`;

  return `${prefix}-${bitten ? 'bitten' : 'intact'}`;
}
