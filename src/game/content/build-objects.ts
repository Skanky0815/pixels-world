import { Breakable } from '../objects/Breakable';
import { Dish } from '../objects/Dish';
import { FoodBag } from '../objects/FoodBag';
import { Carpet } from '../objects/Carpet';
import { ImpactWorld } from '../domain/impact-world';
import { WallPicture } from '../objects/WallPicture';
import type Phaser from 'phaser';
import type { ResolvedRoom, ResolvedObject } from './definitions';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { Vase } from '../objects/Vase';
import { BookStack } from '../objects/BookStack';

export function buildObjects(scene: Phaser.Scene, room: ResolvedRoom) {
  const entries = room.objects.map((definition) => ({
    definition,
    object: createObject(scene, definition),
  }));
  const objects = entries.map((entry) => entry.object);

  return groupObjects(objects, entries);
}

// eslint-disable-next-line max-lines-per-function, complexity -- Der vollständige diskriminierte Switch zeigt die registrierten Objektadapter ohne versteckte Fallthroughs.
function createObject(scene: Phaser.Scene, definition: ResolvedObject) {
  switch (definition.kind) {
    case 'dish':
      return new Dish(scene, definition.config);
    case 'food-bag':
      return new FoodBag(scene, definition.config);
    case 'carpet':
      return new Carpet(scene, definition.config);
    case 'picture':
      return new WallPicture(scene, definition.config);
    case 'books':
      return new BookStack(scene, definition.config);
    case 'couch':
      return new Couch(scene, definition.config);
    case 'curtain':
      return new Curtain(scene, definition.config);
    case 'plant':
      return new Plant(scene, definition.config);
    case 'vase':
      return new Vase(scene, definition.config);
  }
}

// eslint-disable-next-line max-lines-per-function -- Der typisierte Rückgabevertrag und seine stabil geordneten Objektgruppen bleiben zusammen.
function groupObjects(
  objects: (Couch | Curtain | Plant | Vase | BookStack | WallPicture | Carpet | FoodBag | Dish)[],
  entries: {
    readonly definition: ResolvedObject;
    readonly object:
      Couch | Curtain | Plant | Vase | BookStack | WallPicture | Carpet | FoodBag | Dish;
  }[],
) {
  return {
    impacts: new ImpactWorld(),
    carpets: objects.filter((object) => object instanceof Carpet),
    couches: objects.filter((object) => object instanceof Couch),
    curtains: objects.filter((object) => object instanceof Curtain),
    plants: objects.filter((object) => object instanceof Plant),
    breakables: objects.filter((object) => object instanceof Breakable),
    dishes: objects.filter((object) => object instanceof Dish),
    vases: objects.filter((object) => object instanceof Vase),
    pictures: objects.filter((object) => object instanceof WallPicture),
    foodBags: objects.filter((object) => object instanceof FoodBag),
    books: objects.filter((object) => object instanceof BookStack),
    ground: [
      ...objects.filter((object) => object instanceof Carpet),
      ...objects.filter(
        (object): object is Couch | Plant => object instanceof Couch || object instanceof Plant,
      ),
    ],
    entries,
  };
}
