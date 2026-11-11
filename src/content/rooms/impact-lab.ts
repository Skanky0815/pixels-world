import { LIVING_ROOM } from './living-room.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';

const vase = (id: string, x: number, surfaceId: string): ObjectInstance => ({
  id,
  variant: 'blue-vase',
  placement: { mode: 'surface', x, surfaceId },
});
const anchors = LIVING_ROOM.objects.filter((object) =>
  ['couch', 'curtain', 'living-room-rug', 'heirloom-vase'].includes(object.id),
);

/** Authored DEV/E2E scenes: real objects and keyboard routes, never state-setting test hooks. */
// eslint-disable-next-line max-lines-per-function -- Feste Raumdaten und Auflagen bilden zusammen eine reine reproduzierbare DEV-Fixture.
function lab(id: string, objects: readonly ObjectInstance[]): RoomDefinition {
  return {
    ...LIVING_ROOM,
    id,
    objectSlots: [],
    wallSlots: undefined,
    difficultyObjects: undefined,
    platforms: LIVING_ROOM.platforms.map((platform) => ({
      ...platform,
      slots: undefined,
      durability: { stability: platform.id === 'upper-shelf' ? 'stable' : 'fragile' },
    })),
    objects: [
      ...anchors,
      ...(!objects.some((object) => object.id === 'plant')
        ? [
            {
              id: 'plant',
              variant: 'catgrass',
              placement: { mode: 'surface' as const, x: 54, surfaceId: 'floor' },
            },
          ]
        : []),
      ...objects,
    ],
  };
}

export const IMPACT_ROOMS = {
  'impact-landing': lab('impact-landing', [vase('landing-vase', 600, 'floor')]),
  'impact-books': lab('impact-books', [
    {
      id: 'source-books',
      variant: 'reading-books',
      placement: { mode: 'surface', x: 530, surfaceId: 'lower-shelf' },
    },
    vase('target-vase', 578, 'lower-shelf'),
  ]),
  'impact-vases': lab('impact-vases', [
    vase('first-vase', 578, 'lower-shelf'),
    vase('second-vase', 606, 'lower-shelf'),
  ]),
  'impact-fall': lab('impact-fall', [
    vase('falling-vase', 646, 'middle-shelf'),
    vase('target-vase', 530, 'lower-shelf'),
  ]),
  'impact-picture': lab('impact-picture', [
    vase('target-vase', 457, 'floor'),
    {
      id: 'falling-picture',
      variant: 'pixel-portrait',
      placement: { mode: 'area', x: 430, y: 280 },
    },
  ]),
  'impact-shelf': lab('impact-shelf', [
    {
      id: 'plant',
      variant: 'catgrass',
      placement: { mode: 'surface', x: 655, surfaceId: 'floor' },
    },
  ]),
} as const;
