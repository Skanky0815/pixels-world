import { shelfRules } from '../domain/shelf-stability.ts';
import { ASSETS } from '../assets/definitions.ts';
import { overlaps, shuffled } from './slot-geometry.ts';
import { SPAWN_SIZES, spawnSizeFor, type SpawnSize } from './spawn-profile.ts';
import type { Bounds } from '../interactions/contracts.ts';
import type { RoomDefinition } from './definitions.ts';

type Shelf = RoomDefinition['platforms'][number];
type Variant =
  | {
      readonly kind: 'picture';
      readonly asset: 'room-picture';
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: 'shelf';
      readonly asset: 'wood-shelf';
      readonly width: number;
      readonly height: number;
      readonly durability: Shelf['durability'];
    };
export interface WallSlots {
  readonly count: Readonly<Record<'easy' | 'normal' | 'hard', number>>;
  readonly variants: Readonly<Record<string, Variant>>;
  readonly entries: readonly {
    readonly id: string;
    readonly bounds: Bounds;
    readonly capacity: SpawnSize;
    readonly categories: readonly Variant['kind'][];
    readonly pool: readonly string[];
  }[];
}
export interface WallPlacement {
  readonly id: string;
  readonly variant: string;
  readonly kind: Variant['kind'];
  readonly bounds: Bounds;
}
const fail = (message: string): never => {
  throw new Error(`Content wallSlots: ${message}`);
};

const validBounds = (b: Bounds) =>
  b && [b.x, b.y, b.width, b.height].every(Number.isFinite) && b.width > 0 && b.height > 0;
const inside = (a: Bounds, b: Bounds) =>
  a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;

// eslint-disable-next-line max-lines-per-function, complexity -- Alle Wandvorlagen werden vor der Zufallsauswahl geprüft, auch aktuell nicht ausgewählte.
function validateVariants(variants: WallSlots['variants']) {
  for (const [key, variant] of Object.entries(variants)) {
    if (!key.trim() || !['picture', 'shelf'].includes(variant.kind)) fail('invalid variant');
    spawnSizeFor(variant.width, variant.height);

    if (variant.kind === 'shelf' && variant.durability) shelfRules(variant.durability);

    if (!Object.hasOwn(ASSETS, variant.asset)) fail('unknown asset');

    if (variant.kind === 'picture' && variant.asset !== 'room-picture')
      fail('invalid picture asset');

    if (
      variant.kind === 'shelf' &&
      (variant.asset !== 'wood-shelf' || variant.width < 40 || variant.height < 4)
    )
      fail('invalid shelf');
  }
}

// eslint-disable-next-line max-lines-per-function, complexity -- Ein vollständiger Vertrag schützt auch unbesetzte Slots vor ungültigen IDs, Referenzen und Flächen.
function validate(room: RoomDefinition, slots: WallSlots) {
  validateVariants(slots.variants);

  for (const bounds of room.navigationClearances ?? [])
    if (!validBounds(bounds)) fail('invalid navigation clearance');

  if (Object.keys(slots.count).sort().join(',') !== 'easy,hard,normal') fail('missing difficulty');

  for (const count of Object.values(slots.count))
    if (!Number.isSafeInteger(count) || count < 0 || count > slots.entries.length)
      fail('invalid count');
  const ids = new Set([
    room.floor.id,
    room.goal.id,
    ...room.objects.map((o) => o.id),
    ...room.platforms.map((p) => p.id),
    ...room.platforms.flatMap((p) => p.slots?.entries.map((s) => `${p.id}:${s.id}`) ?? []),
    ...(room.objectSlots ?? []).flatMap((g) => [g.id, ...g.entries.map((s) => `${g.id}:${s.id}`)]),
  ]);

  for (const slot of slots.entries) {
    if (!slot.id?.trim() || ids.has(slot.id)) fail('duplicate or empty ID');
    ids.add(slot.id);

    if (
      !validBounds(slot.bounds) ||
      !inside(slot.bounds, { x: 0, y: 0, width: room.width, height: room.floor.y })
    )
      fail('invalid area');

    if (!SPAWN_SIZES.includes(slot.capacity)) fail('invalid capacity');

    if (
      !slot.categories.length ||
      new Set(slot.categories).size !== slot.categories.length ||
      !slot.categories.every((c) => ['picture', 'shelf'].includes(c))
    )
      fail('invalid categories');

    if (
      new Set(slot.pool).size !== slot.pool.length ||
      !slot.pool.every((k) => Object.hasOwn(slots.variants, k))
    )
      fail('invalid pool');
  }
}

function areaFor(slot: WallSlots['entries'][number], variant: Variant): Bounds {
  return {
    x: slot.bounds.x + (slot.bounds.width - variant.width) / 2,
    y: slot.bounds.y + slot.bounds.height - variant.height,
    width: variant.width,
    height: variant.height,
  };
}

// eslint-disable-next-line max-lines-per-function, complexity -- Größenfilter, belegte Flächen und Navigationsschutz entscheiden gemeinsam über eine Vorlage.
function choose(
  slot: WallSlots['entries'][number],
  slots: WallSlots,
  random: () => number,
  occupied: readonly Bounds[],
  room: RoomDefinition,
) {
  for (const key of shuffled(slot.pool, random)) {
    const variant = slots.variants[key];
    const bounds = areaFor(slot, variant);

    if (
      !slot.categories.includes(variant.kind) ||
      SPAWN_SIZES.indexOf(spawnSizeFor(variant.width, variant.height)) >
        SPAWN_SIZES.indexOf(slot.capacity)
    )
      continue;

    if (!inside(bounds, slot.bounds) || occupied.some((other) => overlaps(bounds, other))) continue;

    if (
      variant.kind === 'shelf' &&
      room.navigationClearances?.some((other) => overlaps(bounds, other))
    )
      continue;

    return { id: slot.id, variant: key, kind: variant.kind, bounds };
  }
}

// eslint-disable-next-line max-lines-per-function -- Auswahl und Materialisierung teilen dieselbe RNG-Folge und reservieren jede Fläche genau einmal.
export function populateWallSlots(
  room: RoomDefinition,
  difficulty: 'easy' | 'normal' | 'hard',
  random: () => number,
  occupied: readonly Bounds[],
): RoomDefinition {
  const slots = room.wallSlots;

  if (!slots) return room;
  validate(room, slots);
  const reserved = [
    ...occupied,
    ...room.decorations.flatMap((d) => (d.kind === 'image' ? [d.bounds] : [])),
  ];
  const placements: WallPlacement[] = [];

  for (const slot of shuffled(slots.entries, random)) {
    if (placements.length >= slots.count[difficulty]) break;
    const choice = choose(slot, slots, random, reserved, room);

    if (choice) {
      placements.push(choice);
      reserved.push(choice.bounds);
    }
  }

  return materialize(room, slots, placements);
}

// eslint-disable-next-line max-lines-per-function -- Die Auswahl wird in vorhandene Dekorations- und Plattformtypen übersetzt; keine zweite Laufzeit-Objekthierarchie.
function materialize(
  room: RoomDefinition,
  slots: WallSlots,
  placements: readonly WallPlacement[],
): RoomDefinition {
  const platforms = [...room.platforms];
  const decorations = [...room.decorations];

  for (const p of placements) {
    const variant = slots.variants[p.variant];

    if (variant.kind === 'picture')
      decorations.push({ kind: 'image', asset: variant.asset, bounds: p.bounds });
    else
      platforms.push({
        id: p.id,
        asset: variant.asset,
        bounds: p.bounds,
        durability: variant.durability,
      });
  }

  return { ...room, platforms, decorations, wallPlacements: placements };
}
