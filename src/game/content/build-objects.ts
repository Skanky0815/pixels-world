import type Phaser from 'phaser';
import type { ResolvedRoom, ResolvedObject } from './definitions';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { Vase } from '../objects/Vase';
import type { Destructible, Interactable, ObjectLifecycle } from '../interactions/contracts';

export function buildObjects(scene: Phaser.Scene, room: ResolvedRoom) {
  const couches: Couch[] = [], curtains: Curtain[] = [], plants: Plant[] = [], vases: Vase[] = [];
  const ground: Interactable[] = [];
  const entries: { readonly definition: ResolvedObject; readonly object: Destructible & ObjectLifecycle }[] = [];
  for (const definition of room.objects) {
    let object: Destructible & ObjectLifecycle;
    switch (definition.kind) {
      case 'couch': { const couch = new Couch(scene, definition.config); couches.push(couch); ground.push(couch); object = couch; break; }
      case 'curtain': { const curtain = new Curtain(scene, definition.config); curtains.push(curtain); object = curtain; break; }
      case 'plant': { const plant = new Plant(scene, definition.config); plants.push(plant); ground.push(plant); object = plant; break; }
      case 'vase': { const vase = new Vase(scene, definition.config); vases.push(vase); object = vase; break; }
    }
    entries.push({ definition, object });
  }
  return { couches, curtains, plants, vases, ground, entries };
}
