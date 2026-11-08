import { OBJECTS } from '../content/objects/catalog.ts';
import { LIVING_ROOM } from '../content/rooms/living-room.ts';
import type {
  ObjectCatalog,
  ObjectDefinition,
  ObjectInstance,
  RoomDefinition,
} from '../game/content/definitions.ts';
import { resolveRoom } from '../game/content/resolve-room.ts';

/** All registered variants, including variants absent from the default room. */
export const PLAYGROUND_OBJECTS: ObjectCatalog = OBJECTS;

// eslint-disable-next-line max-lines-per-function -- Ausschließlich Platzierungsdaten für eine isolierte Szene, Regeln bleiben im bestehenden Katalog.
export function playgroundRoom(variant: string, catalog: ObjectCatalog = PLAYGROUND_OBJECTS) {
  if (!Object.hasOwn(catalog, variant)) throw new Error(`Unknown playground variant: ${variant}`);
  const definition = catalog[variant];
  const elevated = definition.capabilities.includes('push');
  const surfaceId = elevated ? 'lab-shelf' : 'floor';
  const room: RoomDefinition = {
    ...LIVING_ROOM,
    id: 'interactable-playground',
    caption: 'Interactable Playground',
    width: 800,
    decorations: [],
    goal: { ...LIVING_ROOM.goal, surfaceId: 'floor', x: 700 },
    spawn: { x: elevated ? 340 : 200, surfaceId },
    platforms: elevated
      ? [
          {
            id: 'lab-shelf',
            durability: { stability: 'fragile' },
            bounds: { x: 290, y: 330, width: 220, height: 16 },
            asset: 'wood-shelf',
          },
        ]
      : [],
    objects: [{ id: 'test-object', variant, placement: placement(definition, surfaceId) }],
  };

  return resolveRoom(room, catalog);
}

function placement(definition: ObjectDefinition, surfaceId: string): ObjectInstance['placement'] {
  if (definition.kind === 'carpet') return { mode: 'surface', x: 185, surfaceId: 'floor' };

  if (definition.kind === 'picture') return { mode: 'area', x: 340, y: 270 };

  if (definition.capabilities.includes('climb') && 'geometry' in definition)
    return { mode: 'area', x: 360, y: LIVING_ROOM.floor.y - definition.geometry.height };

  return { mode: 'surface', x: surfaceId === 'floor' ? 360 : 440, surfaceId };
}
