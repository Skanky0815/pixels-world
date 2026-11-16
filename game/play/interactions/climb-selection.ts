import { overlaps, type ClimbGrip, type InteractionContext } from './contracts.ts';

export const CLIMB_PRIORITY = { curtain: 0, tablecloth: 1, fridge: 2 } as const;

/** Explicit family priority; equal-priority grips retain their authored order. */
export function selectClimbGrip(grips: readonly ClimbGrip[], pixel: InteractionContext['pixel']) {
  let selected: ClimbGrip | undefined;

  for (const grip of grips)
    if (
      overlaps(pixel, grip.area) &&
      (!selected || CLIMB_PRIORITY[grip.kind] < CLIMB_PRIORITY[selected.kind])
    )
      selected = grip;

  return selected;
}
