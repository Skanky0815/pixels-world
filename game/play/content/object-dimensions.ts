import { ASSETS } from '../assets/definitions.ts';
import { DISH_PROFILES } from '../assets/dish-appearance.ts';
import { PANTRY_PROFILES } from '../assets/pantry-appearance.ts';
import type { ObjectDefinition } from './definitions.ts';

/** Intact placement size, shared by slot capacity, candidates and fixed reservations. */
export function objectDimensions(object: ObjectDefinition) {
  const { width, height } = dimensionSource(object);

  return { width, height };
}

// eslint-disable-next-line max-lines-per-function -- Variantenauswahl und Sondergeometrien bilden eine gemeinsame reine Maßquelle.
function dimensionSource(object: ObjectDefinition): {
  readonly width: number;
  readonly height: number;
} {
  if (object.kind === 'couch')
    return { width: object.geometry.width + 18, height: object.geometry.seatRise + 60 };

  if (object.kind === 'tablecloth')
    return { width: object.geometry.width, height: object.geometry.hang };

  if (object.kind === 'carpet' || object.kind === 'curtain') return object.geometry;

  if (object.kind === 'dish') return DISH_PROFILES[object.appearance];

  if (object.kind === 'pantry') return PANTRY_PROFILES[object.appearance];

  return ASSETS[object.asset];
}
