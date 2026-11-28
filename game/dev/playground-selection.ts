import { PLAYGROUND_BASES as PLAYGROUND_SCENARIOS } from '../play/content/playground-layout.ts';
import type { RoomDefinition } from '../play/content/definitions.ts';
import { ROUND_SCENARIOS } from '../play/content/rooms/scenarios.ts';
export { PLAYGROUND_BASES as PLAYGROUND_SCENARIOS } from '../play/content/playground-layout.ts';
import { resolveRoom } from '../play/content/resolve-room.ts';
import { playgroundRoom, PLAYGROUND_OBJECTS } from './playground-room.ts';

export type PlaygroundMode = 'object' | 'scenario';
export interface PlaygroundSelection {
  readonly mode: PlaygroundMode;
  readonly id: string;
}
const defaults = { object: 'cozy-couch', scenario: 'empty' } as const;
const families: [string, string][] = [
  ['empty', 'Leerer Aufbau'],
  ['living-room', 'Wohnzimmer'],
  ['cozy-remix', 'Wohnzimmer-Variante'],
  ['kitchen-preview', 'Küchenvorschau'],
  ['bedroom', 'Schlafzimmer'],
  ['study', 'Arbeitszimmer'],
  ['fridge', 'Kühlschrank'],
  ['food-bag', 'Futterbeutel'],
  ['dish', 'Geschirr'],
  ['herb', 'Kräuter'],
  ['pantry', 'Vorrat'],
  ['bin-', 'Mülleimer'],
  ['cloth-', 'Tischdecke'],
];

export function playgroundChoices(mode: PlaygroundMode) {
  return Object.entries(playgroundCatalog(mode)).map(([id, definition]) => ({
    id,
    label: `${'kind' in definition ? definition.kind : scenarioFamily(id)} · ${id}`,
  }));
}

function scenarioFamily(id: string) {
  return families.find(([prefix]) => id.startsWith(prefix))?.[1] ?? 'Objektkontakt';
}

export function defaultPlaygroundSelection(mode: PlaygroundMode): PlaygroundSelection {
  return { mode, id: defaults[mode] };
}

export function playgroundCatalog(mode: PlaygroundMode) {
  return mode === 'scenario' ? PLAYGROUND_SCENARIOS : PLAYGROUND_OBJECTS;
}

export function validatePlaygroundSelection(selection: PlaygroundSelection) {
  if (!Object.hasOwn(playgroundCatalog(selection.mode), selection.id))
    throw new Error(`Unbekannte Playground-Auswahl: ${selection.id}`);

  return selection;
}

export function parsePlaygroundSelection(search: string): PlaygroundSelection {
  const params = new URLSearchParams(search);
  const mode = params.has('scenario') ? 'scenario' : 'object';
  const id = params.get(mode) ?? defaults[mode];

  return validatePlaygroundSelection({ mode, id });
}

export function playgroundSelectionSearch(selection: PlaygroundSelection) {
  validatePlaygroundSelection(selection);

  return `?${new URLSearchParams({ [selection.mode]: selection.id })}`;
}

export function selectedPlaygroundRoom(selection: PlaygroundSelection) {
  validatePlaygroundSelection(selection);

  return selection.mode === 'object'
    ? playgroundRoom(selection.id)
    : resolveRoom(
        PLAYGROUND_SCENARIOS[selection.id as keyof typeof PLAYGROUND_SCENARIOS],
        PLAYGROUND_OBJECTS,
      );
}

// eslint-disable-next-line max-lines-per-function -- Kataloggrenze, unveränderter Aufbau und reproduzierbarer Seed bilden einen gemeinsamen Rundenlink.
export function playgroundGameLink(
  selection: PlaygroundSelection,
  seed?: string,
  layout?: RoomDefinition,
) {
  if (selection.mode !== 'scenario' || !Object.hasOwn(ROUND_SCENARIOS, selection.id))
    return undefined;

  const original = ROUND_SCENARIOS[selection.id as keyof typeof ROUND_SCENARIOS];

  if (layout && layoutKey(layout) !== layoutKey(original)) return undefined;
  const params = new URLSearchParams({ scenario: selection.id, camera: 'room' });

  if (seed) params.set('room-seed', seed);

  return `/play.html?${params}`;
}

function layoutKey(layout: RoomDefinition) {
  return JSON.stringify([layout.width, layout.spawn, layout.platforms, layout.objects]);
}
