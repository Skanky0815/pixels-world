import { ASSETS, type AssetKey } from '../assets/definitions.ts';
import type { Bounds } from '../interactions/contracts.ts';
import type {
  ObjectCatalog,
  ObjectDefinition,
  ObjectInstance,
  ResolvedObject,
  ResolvedRoom,
  RoomDefinition,
} from './definitions.ts';

function fail(path: string, message: string): never {
  throw new Error(`Content ${path}: ${message}`);
}

function record(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected object');
}

function array(value: unknown, path: string) {
  if (!Array.isArray(value)) fail(path, 'expected array');
}

function number(value: unknown, path: string, min = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min)
    fail(path, `expected finite number >= ${min}`);
}

function integer(value: unknown, path: string, min = 0) {
  if (!Number.isSafeInteger(value) || Number(value) < min)
    fail(path, `expected safe integer >= ${min}`);
}

function id(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'expected nonempty ID');
}

function color(value: unknown, path: string) {
  integer(value, path);

  if (Number(value) > 0xffffff) fail(path, 'expected RGB color');
}

function asset(key: string, kind: string, path: string) {
  if (!Object.hasOwn(ASSETS, key) || ASSETS[key as AssetKey].kind !== kind)
    fail(path, `unknown or incompatible asset ${key}`);
}

function bounds(value: Bounds, room: RoomDefinition, path: string) {
  record(value, path);
  number(value.x, `${path}.x`);
  number(value.y, `${path}.y`);
  number(value.width, `${path}.width`, Number.EPSILON);
  number(value.height, `${path}.height`, Number.EPSILON);

  if (value.x + value.width > room.width || value.y + value.height > room.height)
    fail(path, 'outside room');
}

function supportFits(x: number, width: number, surface: Bounds, path: string) {
  if (x < surface.x || x + width > surface.x + surface.width)
    fail(path, 'object does not fit its support surface');
}

function validateObject(value: ObjectDefinition, path: string) {
  record(value, path);
  asset(value.asset, value.kind, `${path}.asset`);
  const a = ASSETS[value.asset];

  if (
    !('capabilities' in a) ||
    !Array.isArray(value.capabilities) ||
    new Set(value.capabilities).size !== a.capabilities.length ||
    value.capabilities.length !== a.capabilities.length ||
    !a.capabilities.every((capability) => value.capabilities.includes(capability))
  )
    fail(`${path}.capabilities`, 'capabilities do not match implemented asset');

  if (value.kind === 'vase') {
    integer(value.points, `${path}.points`);
    color(value.color, `${path}.color`);

    return;
  }

  record(value.rules, `${path}.rules`);

  if (value.kind === 'plant') {
    for (const key of ['delayMs', 'nibbleMs', 'warningMs'] as const)
      number(value.rules[key], `${path}.rules.${key}`, Number.EPSILON);
    integer(value.rules.nibbleValue, `${path}.rules.nibbleValue`);
    integer(value.rules.tipValue, `${path}.rules.tipValue`);
    record(value.reach, `${path}.reach`);

    if (
      !Number.isFinite(value.reach.left) ||
      !Number.isFinite(value.reach.right) ||
      value.reach.left > 0 ||
      value.reach.right < 0
    )
      fail(`${path}.reach`, 'expected reach spanning the object');

    return;
  }

  record(value.geometry, `${path}.geometry`);
  number(value.geometry.width, `${path}.geometry.width`, value.kind === 'couch' ? 100 : 16);
  number(
    value.geometry.height,
    `${path}.geometry.height`,
    value.kind === 'couch' ? Number.EPSILON : 42,
  );
  number(value.rules.damageIntervalMs, `${path}.rules.damageIntervalMs`, Number.EPSILON);
  integer(value.rules.maxDamage, `${path}.rules.maxDamage`, 1);
  integer(value.rules.damageValue, `${path}.rules.damageValue`);

  if (value.kind === 'couch') {
    number(value.geometry.seatRise, `${path}.geometry.seatRise`, 60);

    if (value.geometry.height + 32 > value.geometry.seatRise)
      fail(`${path}.geometry.height`, 'seat/front extends below support');
    number(value.reach, `${path}.reach`);
    number(value.rules.delayMs, `${path}.rules.delayMs`);
  }
}

/** Resolve and validate all data before creating any Phaser scene or object. */
export function resolveRoom(room: RoomDefinition, catalog: ObjectCatalog): ResolvedRoom {
  record(room, 'room');
  id(room.id, 'room.id');
  const root = `rooms.${room.id}`;

  number(room.width, `${root}.width`, 64);
  number(room.height, `${root}.height`, 64);
  id(room.caption, `${root}.caption`);
  asset(room.pixelAsset, 'sprite', `${root}.pixelAsset`);
  color(room.wallColor, `${root}.wallColor`);
  record(room.floor, `${root}.floor`);
  id(room.floor.id, `${root}.floor.id`);
  number(room.floor.y, `${root}.floor.y`, 60);

  if (room.floor.y >= room.height) fail(`${root}.floor.y`, 'floor must leave positive depth');
  color(room.floor.color, `${root}.floor.color`);
  color(room.floor.plankColor, `${root}.floor.plankColor`);
  integer(room.floor.plankWidth, `${root}.floor.plankWidth`, 4);
  integer(room.floor.plankHeight, `${root}.floor.plankHeight`, 4);
  array(room.platforms, `${root}.platforms`);
  array(room.objects, `${root}.objects`);
  array(room.decorations, `${root}.decorations`);
  record(catalog, 'objects');

  for (const [key, definition] of Object.entries(catalog)) {
    id(key, 'objects.key');
    validateObject(definition, `objects.${key}`);
  }

  const ids = new Set([room.floor.id]);
  const unique = (key: string, path: string) => {
    id(key, path);

    if (ids.has(key)) fail(path, `duplicate ID ${key}`);
    ids.add(key);
  };

  const surfaces = new Map<string, Bounds>([
    [
      room.floor.id,
      { x: 0, y: room.floor.y, width: room.width, height: room.height - room.floor.y },
    ],
  ]);

  for (const platform of room.platforms) {
    record(platform, `${root}.platforms`);
    unique(platform.id, `${root}.platforms.id`);
    bounds(platform.bounds, room, `${root}.platforms.${platform.id}.bounds`);
    asset(platform.asset, 'shelf', `${root}.platforms.${platform.id}.asset`);

    if (
      platform.bounds.width < 40 ||
      platform.bounds.height < 4 ||
      platform.bounds.y + platform.bounds.height > room.floor.y
    )
      fail(`${root}.platforms.${platform.id}`, 'invalid shelf geometry');
    surfaces.set(platform.id, platform.bounds);
  }

  for (const d of room.decorations) {
    record(d, `${root}.decorations`);
    color(d.color, `${root}.decorations.color`);

    if (d.kind === 'rect') bounds(d.bounds, room, `${root}.decorations.bounds`);
    else if (d.kind === 'text') {
      number(d.x, `${root}.decorations.x`);
      number(d.y, `${root}.decorations.y`);
      integer(d.size, `${root}.decorations.size`, 1);

      if (typeof d.text !== 'string' || d.x > room.width || d.y > room.height)
        fail(`${root}.decorations`, 'invalid text');
    } else fail(`${root}.decorations.kind`, 'unknown decoration');
  }

  const instances = new Map<string, ObjectInstance>();

  for (const instance of room.objects) {
    record(instance, `${root}.objects`);
    unique(instance.id, `${root}.objects.id`);
    id(instance.variant, `${root}.objects.${instance.id}.variant`);

    if (!Object.hasOwn(catalog, instance.variant))
      fail(`${root}.objects.${instance.id}.variant`, `unknown variant ${instance.variant}`);
    record(instance.placement, `${root}.objects.${instance.id}.placement`);
    number(instance.placement.x, `${root}.objects.${instance.id}.placement.x`);
    instances.set(instance.id, instance);
  }

  const resolved = new Map<string, ResolvedObject>();
  const pending = new Set<string>();

  function surface(key: string, path: string): Bounds {
    id(key, path);
    const existing = surfaces.get(key);

    if (existing) return existing;
    const instance = instances.get(key);

    if (!instance || catalog[instance.variant]?.kind !== 'couch')
      fail(path, `unknown support surface ${key}`);
    resolve(instance);

    return surfaces.get(key) ?? fail(path, `unresolved support surface ${key}`);
  }

  function resolve(instance: ObjectInstance): ResolvedObject {
    const existing = resolved.get(instance.id);

    if (existing) return existing;
    const path = `${root}.objects.${instance.id}`;

    if (pending.has(instance.id)) fail(`${path}.placement.surfaceId`, 'cyclic surface reference');
    pending.add(instance.id);
    const d = catalog[instance.variant];

    if (!d) fail(`${path}.variant`, 'unknown variant');
    const base = { id: instance.id, variant: instance.variant, asset: d.asset };
    const p = instance.placement;
    let result: ResolvedObject;

    if (d.kind === 'curtain') {
      if (p.mode !== 'area') fail(`${path}.placement`, 'curtain needs area placement');
      number(p.y, `${path}.placement.y`);
      const area = { x: p.x, y: p.y, ...d.geometry };

      bounds(area, room, `${path}.area`);

      if (area.y + area.height > room.floor.y) fail(`${path}.area`, 'curtain extends below floor');
      result = { ...base, kind: 'curtain', config: { id: instance.id, area, rules: d.rules } };
    } else {
      if (p.mode !== 'surface') fail(`${path}.placement`, 'object needs support surface');
      const support = surface(p.surfaceId, `${path}.placement.surfaceId`);

      if (d.kind === 'couch') {
        const seat = {
          x: p.x,
          y: support.y - d.geometry.seatRise,
          width: d.geometry.width,
          height: d.geometry.height,
        };

        bounds(
          {
            x: seat.x - 8,
            y: seat.y - 60,
            width: seat.width + 16,
            height: d.geometry.seatRise + 60,
          },
          room,
          `${path}.geometry`,
        );
        supportFits(p.x, seat.width, support, `${path}.placement`);
        surfaces.set(instance.id, seat);
        result = {
          ...base,
          kind: 'couch',
          config: { id: instance.id, seat, floorY: support.y, reach: d.reach, rules: d.rules },
        };
      } else if (d.kind === 'plant') {
        const a = ASSETS['catgrass-default'];

        bounds(
          { x: p.x - a.width / 2, y: support.y - a.height, width: a.width, height: a.height },
          room,
          `${path}.geometry`,
        );
        supportFits(p.x - a.width / 2, a.width, support, `${path}.placement`);
        result = {
          ...base,
          kind: 'plant',
          config: { id: instance.id, x: p.x, floorY: support.y, reach: d.reach, rules: d.rules },
        };
      } else {
        const a = ASSETS['vase-default'];

        bounds(
          { x: p.x - a.width / 2, y: support.y - a.height, width: a.width, height: a.height },
          room,
          `${path}.geometry`,
        );
        supportFits(p.x - a.width / 2, a.width, support, `${path}.placement`);
        result = {
          ...base,
          kind: 'vase',
          config: {
            id: instance.id,
            x: p.x,
            shelfY: support.y,
            points: d.points,
            color: d.color,
            floorY: room.floor.y,
            roomWidth: room.width,
          },
        };
      }
    }

    pending.delete(instance.id);
    resolved.set(instance.id, result);

    return result;
  }

  const objects = room.objects.map(resolve);
  let maximum = 0;

  for (const object of objects) {
    maximum +=
      object.kind === 'vase'
        ? object.config.points
        : object.kind === 'plant'
          ? object.config.rules.nibbleValue + object.config.rules.tipValue
          : object.config.rules.maxDamage * object.config.rules.damageValue;

    if (!Number.isSafeInteger(maximum))
      fail(`${root}.objects`, 'maximum score exceeds safe integer range');
  }

  record(room.hud, `${root}.hud`);
  record(room.hud.climbHint, `${root}.hud.climbHint`);
  number(room.hud.climbHint.x, `${root}.hud.climbHint.x`);
  number(room.hud.climbHint.y, `${root}.hud.climbHint.y`);

  if (room.hud.climbHint.x > room.width || room.hud.climbHint.y > room.height)
    fail(`${root}.hud.climbHint`, 'outside room viewport');
  record(room.spawn, `${root}.spawn`);
  number(room.spawn.x, `${root}.spawn.x`);
  const spawnSurface = surface(room.spawn.surfaceId, `${root}.spawn.surfaceId`);

  supportFits(room.spawn.x - 26, 52, spawnSurface, `${root}.spawn`);

  if (spawnSurface.y < 52) fail(`${root}.spawn`, 'Pixel does not fit above spawn surface');

  return { definition: room, spawn: { x: room.spawn.x, bottom: spawnSurface.y }, objects };
}
