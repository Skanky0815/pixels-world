import { overlaps, shuffled } from './slot-geometry.ts';
import { populateWallSlots } from './wall-slots.ts';
import { ASSETS } from '../assets/definitions.ts';
import { filterSpawnCandidates, type SpawnSlotFilter } from './spawn-profile.ts';
import { resolveRoom } from './resolve-room.ts';
import type {
  ObjectCatalog,
  ObjectDefinition,
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
type Platform = Pick<RoomDefinition['platforms'][number], 'id' | 'bounds' | 'slots'>;
type Difficulty = 'easy' | 'normal' | 'hard';
type ObjectSlotGroup = NonNullable<RoomDefinition['objectSlots']>[number];
type ObjectSlot = ObjectSlotGroup['entries'][number];

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

  occupied.push({ x: resolved.spawn.x - 26, y: resolved.spawn.bottom - 52, width: 52, height: 52 });
  const generated: ObjectInstance[] = [];

  for (const platform of room.platforms)
    generated.push(...populatePlatform(platform, room, catalog, difficulty, random, occupied));

  for (const group of room.objectSlots ?? [])
    generated.push(...populateGroup(group, room, catalog, difficulty, random, occupied));
  const result = populateWallSlots(
    { ...room, objects: [...generated, ...room.objects] },
    difficulty,
    random,
    occupied,
    catalog,
  );

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
    ...objects.filter((o) => o.kind !== 'carpet').map(objectArea),
    ...room.decorations.flatMap((d) => (d.kind === 'rect' && d.supportedBy ? [d.bounds] : [])),
  ];
}

// eslint-disable-next-line max-lines-per-function -- Der Geometrievergleich hält die vier bestehenden Objektformen gemeinsam sichtbar.
function objectArea(object: ResolvedObject): Bounds {
  const c = object.config;

  if ('area' in c) return c.area;

  if ('seat' in c)
    return {
      x: c.seat.x - 8,
      y: c.seat.y - 60,
      width: c.seat.width + 18,
      height: c.floorY - c.seat.y + 60,
    };
  const asset = looseAsset(object.kind);
  const bottom = 'supportY' in c ? c.supportY : 'shelfY' in c ? c.shelfY : c.floorY;

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

// eslint-disable-next-line max-lines-per-function, complexity -- Poolfilter, exakte Geometrie und Kollisionsprüfung entscheiden gemeinsam über einen Kandidaten.
function choose(
  slot: SpawnSlot,
  platform: Platform,
  room: RoomDefinition,
  catalog: ObjectCatalog,
  random: () => number,
  occupied: Bounds[],
) {
  const compatible = filterSpawnCandidates(catalog, {
    ...slot,
    support: platform.id === room.floor.id ? 'floor' : 'raised',
  });

  for (const key of slot.pool)
    if (!Object.hasOwn(catalog, key)) fail(`${slot.id}: unknown variant ${key}`);

  for (const variant of shuffled(
    slot.pool.filter((key) => compatible.includes(key)),
    random,
  )) {
    const instance = slotInstance(slot, platform, variant, catalog[variant]);
    const asset = candidateSize(catalog[variant]);
    const footprint = slotArea(slot, platform, asset);
    // Die Armlehnen ragen links 8 und rechts 10 Pixel über den Sitz.
    const area =
      catalog[variant].kind === 'couch' ? { ...footprint, x: footprint.x + 1 } : footprint;

    if (
      fits(area, platform.bounds, room) &&
      !occupied.some((other) => overlaps(area, other)) &&
      !(platform.id === room.floor.id && blocked(area, catalog[variant], room))
    )
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

  validateGroups(room, ids);
}

function validateGroups(room: RoomDefinition, ids: Set<string>) {
  if (room.objectSlots !== undefined && !Array.isArray(room.objectSlots))
    fail('expected object slot groups');

  for (const group of room.objectSlots ?? []) validateGroup(group, room, ids);
}

function validateGroup(group: ObjectSlotGroup, room: RoomDefinition, ids: Set<string>) {
  if (!validGroupHeader(group, ids)) fail('invalid slot group');
  ids.add(group.id);
  validateCounts(group, group.id);

  if (Object.keys(group.count).sort().join(',') !== 'easy,hard,normal')
    fail(`${group.id}: missing difficulty`);

  for (const slot of group.entries) validateGroupEntry(slot, group.id, room, ids);
}

// eslint-disable-next-line max-lines-per-function -- Identität, Listenform und Dichtevertrag bilden gemeinsam den Gruppenheader.
function validGroupHeader(group: ObjectSlotGroup, ids: Set<string>) {
  return (
    group &&
    typeof group.id === 'string' &&
    !!group.id.trim() &&
    !ids.has(group.id) &&
    Array.isArray(group.entries) &&
    group.count &&
    typeof group.count === 'object'
  );
}

// eslint-disable-next-line max-lines-per-function -- Auflage und globale ID werden vor derselben Slotregistrierung geprüft.
function validateGroupEntry(
  slot: ObjectSlot,
  group: string,
  room: RoomDefinition,
  ids: Set<string>,
) {
  validateEntry(slot, groupSurface(room, slot.surfaceId));
  const id = `${group}:${slot.id}`;

  if (ids.has(id)) fail(`duplicate ID ${id}`);
  ids.add(id);
}

function groupSurface(room: RoomDefinition, id: string): Platform {
  if (id === room.floor.id)
    return {
      id,
      bounds: { x: 0, y: room.floor.y, width: room.width, height: room.height - room.floor.y },
    };
  const platform = room.platforms.find((surface) => surface.id === id);

  if (!platform) fail(`unknown support surface ${id}`);

  return platform;
}

// eslint-disable-next-line max-lines-per-function -- Dieselbe Pool- und Kollisionswahl gilt für Slots einer Gruppe über mehrere Auflagen hinweg.
function populateGroup(
  group: NonNullable<RoomDefinition['objectSlots']>[number],
  room: RoomDefinition,
  catalog: ObjectCatalog,
  difficulty: Difficulty,
  random: () => number,
  occupied: Bounds[],
) {
  const result: ObjectInstance[] = [];

  for (const slot of shuffled(group.entries, random)) {
    const candidate = choose(
      slot,
      groupSurface(room, slot.surfaceId),
      room,
      catalog,
      random,
      occupied,
    );

    if (candidate && result.length < group.count[difficulty]) {
      result.push({ ...candidate.instance, id: `${group.id}:${slot.id}` });
      occupied.push(candidate.area);
    }
  }

  return result;
}

// eslint-disable-next-line max-lines-per-function -- Der Slotmittelpunkt wird ausschließlich für Sofas in den linken Sitzanker übersetzt.
function slotInstance(
  slot: SpawnSlot,
  platform: Platform,
  variant: string,
  definition: ObjectDefinition,
): ObjectInstance {
  return {
    id: `${platform.id}:${slot.id}`,
    variant,
    placement: {
      mode: 'surface',
      x:
        platform.bounds.x +
        slot.x -
        (definition.kind === 'couch' ? definition.geometry.width / 2 : 0),
      surfaceId: platform.id,
    },
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

function looseAsset(kind: ResolvedObject['kind']) {
  return kind === 'books'
    ? ASSETS['book-stack']
    : kind === 'plant'
      ? ASSETS['catgrass-default']
      : ASSETS['vase-default'];
}

function candidateSize(definition: ObjectDefinition) {
  if (definition.kind === 'couch')
    return { width: definition.geometry.width + 18, height: definition.geometry.seatRise + 60 };

  return looseAsset(definition.kind);
}

function blocked(area: Bounds, definition: ObjectDefinition, room: RoomDefinition) {
  if (!definition.capabilities.some((c) => c === 'platform' || c === 'push')) return false;
  const fixed = room.decorations.flatMap((d) =>
    d.kind === 'image' && ['room-door', 'room-window'].includes(d.asset) ? [d.bounds] : [],
  );

  return [...fixed, ...(room.navigationClearances ?? [])].some((b) => overlaps(area, b));
}
