import type { RoomDefinition } from '../../game/content/definitions.ts';

/** Ein Topf pro Runde; Knabbern, Kippen und Erde bleiben an eine freie Bodenfläche gebunden. */
// eslint-disable-next-line max-lines-per-function -- Die vollständige deklarative Pflanzengruppe hält Filter, Pool und Dichte gemeinsam sichtbar.
export function plantSlots(
  positions: readonly number[],
): NonNullable<RoomDefinition['objectSlots']>[number] {
  return {
    id: 'floor-plants',
    count: { easy: 1, normal: 1, hard: 1 },
    entries: positions.map((x, index) => ({
      id: `grass-${index + 1}`,
      x,
      surfaceId: 'floor',
      capacity: 'medium',
      categories: ['plant'],
      requiredCapabilities: ['automatic', 'damage'],
      pool: ['catgrass'],
    })),
  };
}
