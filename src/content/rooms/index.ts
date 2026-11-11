import { IMPACT_ROOMS } from './impact-lab.ts';
import { LIVING_ROOM } from './living-room.ts';
import { COZY_REMIX } from './cozy-remix.ts';

export const ROOMS = {
  'living-room': LIVING_ROOM,
  'cozy-remix': COZY_REMIX,
  ...IMPACT_ROOMS,
} as const;
export function selectRoom(id: string | null, variants: boolean) {
  if (!variants || !id) return LIVING_ROOM;

  if (!Object.hasOwn(ROOMS, id)) throw new Error(`Unknown room: ${id}`);

  return ROOMS[id as keyof typeof ROOMS];
}
