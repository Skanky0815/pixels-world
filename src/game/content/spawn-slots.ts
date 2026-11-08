import { ASSETS } from '../assets/definitions.ts';
import { filterSpawnCandidates, type SpawnSlotFilter } from './spawn-profile.ts';
import { resolveRoom } from './resolve-room.ts';
import type {
  ObjectCatalog,
  ObjectInstance,
  ResolvedObject,
  RoomDefinition,
} from './definitions.ts';
import type { Bounds } from '../interactions/contracts.ts';

export interface SpawnSlot extends Omit<SpawnSlotFilter, 'support'> {
  readonly id: string;
  /** Mittelpunkt relativ zur linken Kante des Trägers; Auflage ist dessen Oberseite. */
  readonly x: number;
  readonly pool: readonly string[];
}
type Platform = RoomDefinition['platforms'][number];
type Difficulty = 'easy' | 'normal' | 'hard';
const overlaps = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

function fail(message: string): never {
  throw new Error(`Content spawnSlots: ${message}`);
}

/** RNG comes from Phaser.RandomDataGenerator; this module stays independent of the engine. */
// eslint-disable-next-line max-lines-per-function -- Vorvalidierung, einmalige Materialisierung und Abschlussprüfung bilden einen festen Content-Aufbau.
export function populateSpawnSlots(
  room: RoomDefinition,
  catalog: ObjectCatalog,
  difficulty: Difficulty,
  random: () => number,
): RoomDefinition {
  const resolved = resolveRoom(room, catalog);

  validateIds(room);
  const occupied = reservedAreas(resolved.objects, room, resolved.goal.area);
  const generated: ObjectInstance[] = [];

  for (const platform of room.platforms)
    generated.push(...populatePlatform(platform, room, catalog, difficulty, random, occupied));
  const result = { ...room, objects: [...generated, ...room.objects] };

  resolveRoom(result, catalog);

  return result;
}

// eslint-disable-next-line max-lines-per-function -- Die geschützten Flächen bleiben als gemeinsame Liste des Platzierungsvertrags sichtbar.
function reservedAreas(
  objects: readonly ResolvedObject[],
  room: RoomDefinition,
  goal: Bounds,
): Bounds[] {
  return [
    goal,
    ...room.platforms.map((p) => p.bounds),
    ...objects.map(objectArea),
    ...room.decorations.flatMap((d) => (d.kind === 'rect' && d.supportedBy ? [d.bounds] : [])),
  ];
}

// eslint-disable-next-line max-lines-per-function -- Der Geometrievergleich hält die vier bestehenden Objektformen gemeinsam sichtbar.
function objectArea(object: ResolvedObject): Bounds {
  const c = object.config;

  if ('area' in c) return c.area;

  if ('seat' in c) return { ...c.seat, height: c.floorY - c.seat.y };
  const asset =
    object.kind === 'books'
      ? ASSETS['book-stack']
      : object.kind === 'plant'
        ? ASSETS['catgrass-default']
        : ASSETS['vase-default'];
  const bottom = 'shelfY' in c ? c.shelfY : c.floorY;

  return {
    x: c.x - asset.width / 2,
    y: bottom - asset.height,
    width: asset.width,
    height: asset.height,
  };
}

function validateSlots(platform: Platform) {
  const slots = platform.slots;

  if (!slots) return;

  if (!Array.isArray(slots.entries)) fail(`${platform.id}: expected entries`);

  if (!slots.count || typeof slots.count !== 'object') fail(`${platform.id}: invalid counts`);

  validateCounts(slots, platform.id);

  if (Object.keys(slots.count).sort().join(',') !== 'easy,hard,normal')
    fail(`${platform.id}: missing difficulty`);

  for (const slot of slots.entries) validateEntry(slot, platform);
}

function validateCounts(slots: NonNullable<Platform['slots']>, id: string) {
  for (const count of Object.values(slots.count))
    if (!Number.isSafeInteger(count) || count < 0 || count > slots.entries.length)
      fail(`${id}: invalid count`);
}

// eslint-disable-next-line max-lines-per-function -- Lokaler Anker, ID und eindeutiger Pool werden als ein Slotvertrag geprüft.
function validateEntry(slot: SpawnSlot, platform: Platform) {
  if (
    typeof slot.id !== 'string' ||
    !slot.id.trim() ||
    !Number.isFinite(slot.x) ||
    slot.x < 0 ||
    slot.x > platform.bounds.width
  )
    fail(`${platform.id}: invalid slot`);

  if (!Array.isArray(slot.pool) || new Set(slot.pool).size !== slot.pool.length)
    fail(`${slot.id}: invalid pool`);
}

function shuffled<T>(entries: readonly T[], random: () => number): T[] {
  const result = [...entries];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// eslint-disable-next-line max-lines-per-function -- Slotreihenfolge, Dichtebegrenzung und Reservierung müssen dieselbe Auswahl atomar abbilden.
function populatePlatform(
  platform: Platform,
  room: RoomDefinition,
  catalog: ObjectCatalog,
  difficulty: Difficulty,
  random: () => number,
  occupied: Bounds[],
) {
  if (!platform.slots) return [];
  const result: ObjectInstance[] = [];

  for (const slot of shuffled(platform.slots.entries, random)) {
    const candidate = choose(slot, platform, room, catalog, random, occupied);

    if (candidate && result.length < platform.slots.count[difficulty]) {
      result.push(candidate.instance);
      occupied.push(candidate.area);
    }
  }

  return result.sort((a, b) => a.placement.x - b.placement.x);
}

// eslint-disable-next-line max-lines-per-function -- Poolfilter, exakte Geometrie und Kollisionsprüfung entscheiden gemeinsam über einen Kandidaten.
function choose(
  slot: SpawnSlot,
  platform: Platform,
  room: RoomDefinition,
  catalog: ObjectCatalog,
  random: () => number,
  occupied: Bounds[],
) {
  const compatible = filterSpawnCandidates(catalog, { ...slot, support: 'raised' });

  for (const key of slot.pool)
    if (!Object.hasOwn(catalog, key)) fail(`${slot.id}: unknown variant ${key}`);

  for (const variant of shuffled(
    slot.pool.filter((key) => compatible.includes(key)),
    random,
  )) {
    const instance = slotInstance(slot, platform, variant);
    const asset =
      catalog[variant].kind === 'plant' ? ASSETS['catgrass-default'] : ASSETS['vase-default'];
    const area = slotArea(slot, platform, asset);

    if (fits(area, platform.bounds, room) && !occupied.some((other) => overlaps(area, other)))
      return { instance, area };
  }
}

function fits(area: Bounds, support: Bounds, room: RoomDefinition) {
  return (
    area.x >= support.x &&
    area.x + area.width <= support.x + support.width &&
    area.y >= 0 &&
    area.y + area.height <= room.floor.y
  );
}

// eslint-disable-next-line max-lines-per-function -- Das globale ID-Register schützt auch unbesetzte Slots vor Konflikten.
function validateIds(room: RoomDefinition) {
  const ids = new Set([
    room.floor.id,
    room.goal.id,
    ...room.objects.map((o) => o.id),
    ...room.platforms.map((p) => p.id),
  ]);

  for (const platform of room.platforms) {
    validateSlots(platform);

    for (const slot of platform.slots?.entries ?? []) {
      const id = `${platform.id}:${slot.id}`;

      if (ids.has(id)) fail(`duplicate ID ${id}`);
      ids.add(id);
    }
  }
}

function slotInstance(slot: SpawnSlot, platform: Platform, variant: string): ObjectInstance {
  return {
    id: `${platform.id}:${slot.id}`,
    variant,
    placement: { mode: 'surface', x: platform.bounds.x + slot.x, surfaceId: platform.id },
  };
}

// eslint-disable-next-line max-lines-per-function -- Lokaler Mittelpunkt und Assetmaße werden gemeinsam in Weltkoordinaten umgerechnet.
function slotArea(
  slot: SpawnSlot,
  platform: Platform,
  asset: { width: number; height: number },
): Bounds {
  return {
    x: platform.bounds.x + slot.x - asset.width / 2,
    y: platform.bounds.y - asset.height,
    width: asset.width,
    height: asset.height,
  };
}
