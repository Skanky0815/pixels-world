import { LAB_ROOMS } from '../play/content/rooms/index.ts';
import { resolveRoom } from '../play/content/resolve-room.ts';
import { playgroundRoom, PLAYGROUND_OBJECTS } from './playground-room.ts';

export const PLAYGROUND_SCENARIOS = LAB_ROOMS;
export type PlaygroundMode = 'object' | 'scenario';
export interface PlaygroundSelection {
  readonly mode: PlaygroundMode;
  readonly id: string;
}
const defaults = { object: 'cozy-couch', scenario: 'fridge-incoming' } as const;
const families: [string, string][] = [
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

export function playgroundGameLink(selection: PlaygroundSelection) {
  if (selection.mode !== 'scenario') return undefined;
  validatePlaygroundSelection(selection);

  return `/play.html?${new URLSearchParams({ room: selection.id, camera: 'room' })}`;
}
