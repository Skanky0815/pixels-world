import type { ImpactActor, ImpactWorld } from '../domain/impact-world';
import { Shelf } from '../objects/Shelf';
import type Phaser from 'phaser';
import type { Pixel } from '../actors/Pixel';
import type { ChaosEvent } from '../domain/chaos-event';
import type { InputState } from '../input/input-state';
import { selectClimbGrip } from '../interactions/climb-selection';
import {
  updateGroundInteractions,
  type InteractionContext,
  type ClimbGrip,
  type Bounds,
} from '../interactions/contracts';
import type { Breakable } from '../objects/Breakable';
import type { buildObjects } from './build-objects';
import type { RoomDefinition } from './definitions';
import { drawRoom } from './draw-room';

type Objects = ReturnType<typeof buildObjects>;
type Damage = (event: ChaosEvent | undefined) => void;

/** Shared room bodies; the regular game and DEV playground use identical colliders. */
// eslint-disable-next-line max-lines-per-function -- Raumzeichnung und geordneter Aufbau von Boden und Plattformen gehören zusammen.
export function createRoomPhysics(scene: Phaser.Scene, room: RoomDefinition) {
  drawRoom(scene, room);
  const platforms = scene.physics.add.staticGroup();
  const floor = addPlatform(
    scene,
    platforms,
    0,
    room.floor.y,
    room.width,
    room.height - room.floor.y,
  );

  const shelves = room.platforms.map(
    (definition) => new Shelf(scene, definition, room.floor.y, room.decorations),
  );

  for (const shelf of shelves) platforms.add(shelf.platform.setData('impactActor', shelf));

  return { platforms, floor, shelves };
}

// eslint-disable-next-line max-lines-per-function -- Der vollständige Flächenvertrag bleibt neben seiner statischen Physikregistrierung sichtbar.
function addPlatform(
  scene: Phaser.Scene,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const surface = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0);

  scene.physics.add.existing(surface, true);
  platforms.add(surface);

  return surface;
}

// eslint-disable-next-line max-lines-per-function -- Gemeinsame Collider-Verdrahtung aller registrierten Adapter; keine zweite DEV-Physik.
export function connectObjectPhysics(
  scene: Phaser.Scene,
  objects: Objects,
  pixel: Pixel,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  floor: Phaser.GameObjects.Rectangle,
  damage: Damage,
  canInteract: () => boolean = () => true,
) {
  objects.impacts.setDamage((event) => damage(event));

  for (const couch of objects.couches) platforms.add(couch.platform.setData('impactActor', couch));
  scene.physics.add.collider(pixel.collider, platforms);

  for (const vase of objects.breakables) {
    scene.physics.add.collider(vase.collider, platforms, (_object, surface) => {
      const partner =
        'getData' in surface
          ? (surface.getData('impactActor') as ImpactActor | undefined)
          : undefined;

      objects.impacts.collide(vase, partner);

      if (surface === floor) damage(vase.landOnFloor());
      else vase.landOnSurface();
    });
    scene.physics.add.collider(
      pixel.collider,
      vase.collider,
      () => pushVase(pixel, vase),
      () => canInteract() && vase.allowsPixelCollision(pixel.snapshot()),
    );
  }

  connectVases(scene, objects);
}

function connectVases(scene: Phaser.Scene, objects: Objects) {
  for (let a = 0; a < objects.breakables.length; a++)
    for (let b = a + 1; b < objects.breakables.length; b++) {
      const first = objects.breakables[a],
        second = objects.breakables[b];

      scene.physics.add.collider(first.collider, second.collider, () =>
        objects.impacts.collide(first, second),
      );
    }
}

function pushVase(pixel: Pixel, vase: Breakable) {
  const body = vase.collider.body as Phaser.Physics.Arcade.Body;
  const pixelBody = pixel.collider.body as Phaser.Physics.Arcade.Body;

  if (body.touching.up && pixelBody.bottom <= body.top + 1)
    vase.topple(pixel.x < vase.collider.x ? 1 : -1);

  if (body.touching.left || body.touching.right) vase.push(pixel.x < vase.collider.x ? 1 : -1);
}

/** Same ordered object/actor step for the game and isolated object tests. */
// eslint-disable-next-line max-lines-per-function, complexity -- Auswahl, Bewegung, unveränderlicher Kontakt und Interaktionsfolge bleiben als ein fachlicher Frame zusammen.
export function advanceObjectInteractions(
  objects: Objects,
  pixel: Pixel,
  input: InputState,
  time: number,
  delta: number,
  damage: Damage,
  shelves: readonly Shelf[] = [],
) {
  updateShelves(shelves, pixel, time, damage);
  const supported = [
    ...objects.tablecloths,
    ...objects.breakables,
    ...objects.books,
    ...objects.topplingContainers,
    ...objects.plants,
  ];

  releaseShelves(shelves, supported, objects.impacts, damage);

  for (const vase of objects.breakables) {
    vase.updateFall(pixel.snapshot());
  }

  const grip = selectClimbGrip(
    [...objects.curtains, ...objects.tablecloths, ...shelves].flatMap((o) => o.climbGrips()),
    pixel.snapshot(),
  );
  const fridges = shelves.flatMap((shelf) => (shelf.fridge ? [shelf.fridge] : []));
  const insideFridge = fridges.some((fridge) => fridge.snapshot().captured);

  if (!insideFridge) pixel.move(input, time, delta, grip?.area, grip);
  const context: InteractionContext = Object.freeze({
    time,
    delta,
    input,
    pixel: Object.freeze(pixel.snapshot()),
  });

  for (const object of objects.curtains)
    damage(object.updateClimb(context, object.id === grip?.ownerId && context.pixel.climbing));
  objects.pictures.forEach((picture) => damage(picture.update(context, true).event));
  objects.books.forEach((books) => damage(books.update(context, true).event));
  objects.topplingContainers.forEach((bag) => damage(bag.update(context, true).event));

  advanceCloths(objects, context, damage, grip);
  const interaction = updateGroundInteractions([...fridges, ...objects.ground], context);

  damage(interaction.event);
  objects.impacts.advance([...objects.entries.map((entry) => entry.object), ...shelves], delta);
  releaseShelves(shelves, supported, objects.impacts, damage);

  if (interaction.faceX !== undefined) pixel.faceToward(interaction.faceX);

  if (grip?.faceX !== undefined && context.pixel.climbing) pixel.faceToward(grip.faceX);
  pixel.present(time, interaction.action, context.pixel.climbing && input.vertical >= 0);
  pixel.hideInFurniture(
    fridges.some((fridge) => fridge.snapshot().hidden),
    fridges.some((fridge) => fridge.snapshot().captured),
  );
}

function updateShelves(shelves: readonly Shelf[], pixel: Pixel, time: number, damage: Damage) {
  for (const shelf of shelves) damage(shelf.update(pixel.snapshot(), time));
}

// eslint-disable-next-line max-lines-per-function -- Beide Kontaktphasen geben jede verlorene Auflage genau einmal frei, auch bei einem Fremdtreffer im letzten Rundenframe.
function releaseShelves(
  shelves: readonly Shelf[],
  supported: readonly (ImpactActor & { releaseSupport(surface: Bounds): ChaosEvent | void })[],
  impacts: ImpactWorld,
  damage: Damage,
) {
  for (const shelf of shelves) {
    if (!shelf.consumeSupportLoss()) continue;

    for (const object of supported) {
      impacts.inheritSupport(shelf, object);
      const event = object.releaseSupport(shelf.bounds);

      if (event) damage(event);
    }
  }
}

// eslint-disable-next-line max-lines-per-function, complexity -- Geordnete Stoffzüge übertragen Bewegung und kausale Herkunft gemeinsam auf unterstützte Oberflächenobjekte.
function advanceCloths(
  objects: Objects,
  context: InteractionContext,
  damage: Damage,
  grip?: ClimbGrip,
) {
  for (const cloth of objects.tablecloths) {
    const { event, drag } = cloth.update(
      context,
      cloth.id === grip?.ownerId && context.pixel.climbing,
      grip?.side,
    );

    damage(event);

    if (!drag) continue;

    for (const { object } of objects.entries)
      if ('dragOnSurface' in object && object.dragOnSurface(drag.surface, drag.area, drag.dx))
        objects.impacts.inheritSupport(cloth, object);
  }
}
