import type { RoomDefinition } from '../../game/content/definitions.ts';
const count = { easy: 1, normal: 1, hard: 1 } as const;
const filter = {
  capacity: 'medium',
  categories: ['decoration'],
  requiredCapabilities: ['automatic', 'damage'],
  pool: ['reading-books', 'upright-books'],
} as const;

/** Two independent groups choose one floor position and one shelf position each round. */
// eslint-disable-next-line max-lines-per-function -- Die deklarativen Boden- und Regalgruppen zeigen Slotfilter und Auflagen nebeneinander.
export function bookSlots(
  floorPositions: readonly number[],
): NonNullable<RoomDefinition['objectSlots']> {
  return [
    {
      id: 'book-floor',
      count,
      entries: floorPositions.map((x, index) => ({
        ...filter,
        id: `floor-${index + 1}`,
        surfaceId: 'floor',
        x,
      })),
    },
    {
      id: 'book-shelf',
      count,
      entries: [
        { ...filter, id: 'lower-left', surfaceId: 'lower-shelf', x: 28 },
        { ...filter, id: 'middle-left', surfaceId: 'middle-shelf', x: 24 },
      ],
    },
  ];
}
