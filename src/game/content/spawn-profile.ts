import { ASSETS } from '../assets/definitions.ts';
import type { Capability, ObjectCatalog, ObjectDefinition } from './definitions.ts';

export const SPAWN_SIZES = ['small', 'medium', 'large'] as const;
export const SPAWN_CATEGORIES = ['decoration', 'plant', 'furniture', 'toy'] as const;
export type SpawnSize = (typeof SPAWN_SIZES)[number];
export type SpawnCategory = (typeof SPAWN_CATEGORIES)[number];
export type SpawnProfile = {
  readonly size: SpawnSize;
  readonly category: SpawnCategory;
} & (
  | { readonly random: true; readonly support: 'floor' | 'any-surface' }
  | { readonly random: false; readonly reason: 'room-fixture' | 'main-goal' }
);
export interface FixedGoalSpawnProfile {
  readonly size: 'small';
  readonly category: 'toy';
  readonly random: false;
  readonly reason: 'main-goal';
}
export interface SpawnSlotFilter {
  readonly capacity: SpawnSize;
  readonly categories: readonly SpawnCategory[];
  readonly support: 'floor' | 'raised';
  readonly requiredCapabilities?: readonly Capability[];
}
const CATEGORIES = {
  vase: 'decoration',
  books: 'decoration',
  plant: 'plant',
  couch: 'furniture',
  curtain: 'furniture',
} as const;
const CAPABILITIES = new Set<string>(
  Object.values(ASSETS).flatMap<string>((a) =>
    'capabilities' in a ? Array.from(a.capabilities) : [],
  ),
);

function fail(path: string, message: string): never {
  throw new Error(`Content ${path}: ${message}`);
}

function record(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail(path, 'expected spawn profile');
}

export function spawnSizeFor(width: number, height: number): SpawnSize {
  if (![width, height].every((v) => Number.isFinite(v) && v > 0))
    throw new Error('Invalid spawn dimensions');

  if (width <= 32 && height <= 32) return 'small';

  if (width <= 96 && height <= 96) return 'medium';

  return 'large';
}

function objectSize(object: ObjectDefinition) {
  if (object.kind === 'books') return spawnSizeFor(48, 36);

  if (object.kind === 'couch') return spawnSizeFor(object.geometry.width, object.geometry.seatRise);

  if (object.kind === 'curtain') return spawnSizeFor(object.geometry.width, object.geometry.height);
  const asset = object.kind === 'plant' ? ASSETS['catgrass-default'] : ASSETS['vase-default'];

  return spawnSizeFor(asset.width, asset.height);
}

function validateProfile(value: unknown, path: string): asserts value is SpawnProfile {
  record(value, path);

  if (!SPAWN_SIZES.includes(value.size as SpawnSize)) fail(`${path}.size`, 'unknown size');

  if (!SPAWN_CATEGORIES.includes(value.category as SpawnCategory))
    fail(`${path}.category`, 'unknown category');

  if (value.random === true) validateRandom(value, path);
  else if (value.random === false) validateFixed(value, path);
  else fail(`${path}.random`, 'expected boolean');
}

function validateRandom(value: Record<string, unknown>, path: string) {
  if (value.support !== 'floor' && value.support !== 'any-surface')
    fail(`${path}.support`, 'unknown support');

  if ('reason' in value) fail(path, 'random profile cannot have an exclusion reason');
}

function validateFixed(value: Record<string, unknown>, path: string) {
  if (value.reason !== 'room-fixture' && value.reason !== 'main-goal')
    fail(`${path}.reason`, 'missing exclusion reason');

  if ('support' in value) fail(path, 'excluded profile cannot have random support');
}

export function validateObjectSpawn(object: ObjectDefinition, path: string) {
  validateProfile(object.spawn, `${path}.spawn`);

  if (object.spawn.category !== CATEGORIES[object.kind])
    fail(`${path}.spawn.category`, 'category does not match object');

  if (object.spawn.size !== objectSize(object))
    fail(`${path}.spawn.size`, 'size does not match dimensions');

  if (object.spawn.random) validateRandomObject(object, `${path}.spawn`);
  else if (object.spawn.reason !== 'room-fixture')
    fail(`${path}.spawn.reason`, 'object is not a main goal');
}

function validateRandomObject(object: ObjectDefinition, path: string) {
  if (object.kind === 'couch' || object.kind === 'curtain')
    fail(path, 'structural object must stay fixed');

  if (object.kind === 'plant' && object.spawn.random && object.spawn.support !== 'floor')
    fail(`${path}.support`, 'plant requires fixed floor support');
}

export function validateGoalSpawn(value: unknown, path: string) {
  validateProfile(value, path);

  if (
    value.random ||
    value.reason !== 'main-goal' ||
    value.category !== 'toy' ||
    value.size !== 'small'
  )
    fail(path, 'main goal must stay protected from random placement');
}

function validateSlot(slot: SpawnSlotFilter) {
  record(slot, 'spawnSlot');

  if (!SPAWN_SIZES.includes(slot.capacity)) fail('spawnSlot.capacity', 'unknown size');

  if (!['floor', 'raised'].includes(slot.support)) fail('spawnSlot.support', 'unknown support');
  validateChoices(slot.categories, SPAWN_CATEGORIES, 'spawnSlot.categories');

  if (slot.requiredCapabilities !== undefined)
    validateChoices(slot.requiredCapabilities, [...CAPABILITIES], 'spawnSlot.requiredCapabilities');
}

function validateChoices(values: readonly string[], known: readonly string[], path: string) {
  if (
    !Array.isArray(values) ||
    new Set(values).size !== values.length ||
    !values.every((v) => known.includes(v))
  )
    fail(path, 'expected unique known entries');
}

/** Coarse fit only; exact geometry and overlap remain the room resolver's responsibility. */
export function fitsSpawnSlot(
  profile: SpawnProfile,
  capabilities: readonly Capability[],
  slot: SpawnSlotFilter,
) {
  validateProfile(profile, 'spawnProfile');
  validateSlot(slot);

  return matchesSlot(profile, capabilities, slot);
}

// eslint-disable-next-line max-lines-per-function -- Größe, Kategorie, Auflage und kombinierte Fähigkeiten bilden ein gemeinsames Auswahlprädikat.
function matchesSlot(
  profile: SpawnProfile,
  capabilities: readonly Capability[],
  slot: SpawnSlotFilter,
) {
  return (
    profile.random &&
    SPAWN_SIZES.indexOf(profile.size) <= SPAWN_SIZES.indexOf(slot.capacity) &&
    slot.categories.includes(profile.category) &&
    (profile.support === 'any-surface' || slot.support === 'floor') &&
    (slot.requiredCapabilities ?? []).every((capability) => capabilities.includes(capability))
  );
}

export function filterSpawnCandidates(catalog: ObjectCatalog, slot: SpawnSlotFilter) {
  validateSlot(slot);

  return Object.entries(catalog)
    .filter(([key, object]) => {
      validateObjectSpawn(object, `objects.${key}`);

      return matchesSlot(object.spawn, object.capabilities, slot);
    })
    .map(([key]) => key);
}
