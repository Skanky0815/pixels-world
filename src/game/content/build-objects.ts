import type Phaser from 'phaser';
import type { ResolvedRoom, ResolvedObject } from './definitions';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { Vase } from '../objects/Vase';

export function buildObjects(scene: Phaser.Scene, room: ResolvedRoom) {
  const entries = room.objects.map((definition) => ({
    definition,
    object: createObject(scene, definition),
  }));
  const objects = entries.map((entry) => entry.object);

  return groupObjects(objects, entries);
}

// eslint-disable-next-line max-lines-per-function -- Der vollständige diskriminierte Switch zeigt die vier erlaubten Objektadapter ohne versteckte Fallthroughs.
function createObject(scene: Phaser.Scene, definition: ResolvedObject) {
  switch (definition.kind) {
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
  objects: (Couch | Curtain | Plant | Vase)[],
  entries: {
    readonly definition: ResolvedObject;
    readonly object: Couch | Curtain | Plant | Vase;
  }[],
) {
  return {
    couches: objects.filter((object) => object instanceof Couch),
    curtains: objects.filter((object) => object instanceof Curtain),
    plants: objects.filter((object) => object instanceof Plant),
    vases: objects.filter((object) => object instanceof Vase),
    ground: objects.filter(
      (object): object is Couch | Plant => object instanceof Couch || object instanceof Plant,
    ),
    entries,
  };
}
