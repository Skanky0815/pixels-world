import type { ImpactActor, ImpactWorld } from '../domain/impact-world';
import { Shelf } from '../objects/Shelf';
import type Phaser from 'phaser';
import type { Pixel } from '../actors/Pixel';
import type { ChaosEvent } from '../domain/chaos-event';
import type { InputState } from '../input/input-state';
import {
  overlaps,
  updateGroundInteractions,
  type InteractionContext,
  type Bounds,
} from '../interactions/contracts';
import type { Vase } from '../objects/Vase';
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

  for (const shelf of shelves) platforms.add(shelf.platform);

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
) {
  objects.impacts.setDamage((event) => damage(event));

  for (const couch of objects.couches) platforms.add(couch.platform);
  scene.physics.add.collider(pixel.collider, platforms);

  for (const vase of objects.vases) {
    scene.physics.add.collider(vase.collider, platforms, (_object, surface) => {
      objects.impacts.collide(vase);

      if (surface === floor) damage(vase.landOnFloor());
      else vase.landOnSurface();
    });
    scene.physics.add.collider(
      pixel.collider,
      vase.collider,
      () => pushVase(pixel, vase),
      () => vase.allowsPixelCollision(pixel.snapshot()),
    );
  }

  connectVases(scene, objects);
}

function connectVases(scene: Phaser.Scene, objects: Objects) {
  for (let a = 0; a < objects.vases.length; a++)
    for (let b = a + 1; b < objects.vases.length; b++) {
      const first = objects.vases[a],
        second = objects.vases[b];

      scene.physics.add.collider(first.collider, second.collider, () =>
        objects.impacts.collide(first, second),
      );
    }
}

function pushVase(pixel: Pixel, vase: Vase) {
  const body = vase.collider.body as Phaser.Physics.Arcade.Body;
  const pixelBody = pixel.collider.body as Phaser.Physics.Arcade.Body;

  if (body.touching.up && pixelBody.bottom <= body.top + 1)
    vase.topple(pixel.x < vase.collider.x ? 1 : -1);

  if (body.touching.left || body.touching.right) vase.push(pixel.x < vase.collider.x ? 1 : -1);
}

/** Same ordered object/actor step for the game and isolated object tests. */
// eslint-disable-next-line max-lines-per-function -- Auswahl, Bewegung, unveränderlicher Kontakt und Interaktionsfolge bleiben als ein fachlicher Frame zusammen.
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
  const supported = [...objects.vases, ...objects.books];

  releaseShelves(shelves, supported, objects.impacts);

  for (const vase of objects.vases) {
    vase.updateFall(pixel.snapshot());
  }

  const surface = objects.curtains.find((object) => overlaps(pixel.snapshot(), object.climbArea));

  pixel.move(input, time, delta, surface?.climbArea);
  const context: InteractionContext = Object.freeze({
    time,
    delta,
    input,
    pixel: Object.freeze(pixel.snapshot()),
  });

  for (const object of objects.curtains)
    damage(object.updateClimb(context, object === surface && context.pixel.climbing));
  objects.pictures.forEach((picture) => damage(picture.update(context, true).event));
  objects.books.forEach((books) => damage(books.update(context, true).event));

  const interaction = updateGroundInteractions(objects.ground, context);

  damage(interaction.event);
  objects.impacts.advance([...objects.entries.map((entry) => entry.object), ...shelves], delta);
  releaseShelves(shelves, supported, objects.impacts);

  if (interaction.faceX !== undefined) pixel.faceToward(interaction.faceX);
  pixel.present(time, interaction.action, surface?.snapshot().state === 'sliding');
}

function updateShelves(shelves: readonly Shelf[], pixel: Pixel, time: number, damage: Damage) {
  for (const shelf of shelves) damage(shelf.update(pixel.snapshot(), time));
}

// eslint-disable-next-line max-lines-per-function -- Beide Kontaktphasen geben jede verlorene Auflage genau einmal frei, auch bei einem Fremdtreffer im letzten Rundenframe.
function releaseShelves(
  shelves: readonly Shelf[],
  supported: readonly (ImpactActor & { releaseSupport(surface: Bounds): void })[],
  impacts: ImpactWorld,
) {
  for (const shelf of shelves) {
    if (!shelf.consumeSupportLoss()) continue;

    for (const object of supported) {
      impacts.inheritSupport(shelf, object);
      object.releaseSupport(shelf.bounds);
    }
  }
}
