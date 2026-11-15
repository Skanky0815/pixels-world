import type { PlaygroundScene } from './PlaygroundScene';

export type PlaygroundSnapshot = ReturnType<PlaygroundScene['snapshot']>;
export interface PlaygroundTarget {
  readonly id: string;
  readonly label: string;
  readonly state: { readonly state: string };
}

// eslint-disable-next-line max-lines-per-function -- Objekte und feste Möbel erhalten zusammen eine rein lesende, eindeutig benannte Zielbeschreibung.
export function playgroundTargets(snapshot: PlaygroundSnapshot): PlaygroundTarget[] {
  const objects = snapshot.objects.map((object) => ({
    id: `object:${object.id}`,
    label: `${object.kind} · ${snapshot.mode === 'object' ? object.variant : object.id}`,
    state: object.state,
  }));
  const shelves = snapshot.shelves.map((shelf) => ({
    id: `shelf:${shelf.id}`,
    label: `${shelf.isFridge ? 'Kühlschrank' : 'Auflage'} · ${shelf.id}`,
    state: shelf.fridge ?? shelf,
  }));

  return [...objects, ...shelves];
}

export function defaultPlaygroundTarget(snapshot: PlaygroundSnapshot, targets: PlaygroundTarget[]) {
  const fridge = snapshot.variant.startsWith('fridge-')
    ? snapshot.shelves.find((shelf) => shelf.isFridge)
    : undefined;

  return fridge ? `shelf:${fridge.id}` : (targets[0]?.id ?? '');
}
