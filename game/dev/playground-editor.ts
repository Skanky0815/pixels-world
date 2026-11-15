/* eslint-disable max-lines-per-function -- Zusammenhängende Editoraktionen validieren den Aufbau und aktualisieren die zugehörigen Formularfelder gemeinsam. */
import type { PlaygroundScene } from './PlaygroundScene';
import type { PlaygroundSnapshot } from './playground-diagnostics';
import { PLAYGROUND_OBJECTS as OBJECTS } from './playground-room';
import type { ObjectInstance, RoomDefinition } from '../play/content/definitions';
import {
  spawnPlaygroundObject,
  movePlaygroundObject,
  removePlaygroundObject,
  buildPlaygroundRecipe,
  recipeForPlayground,
  type PlaygroundRecipe,
} from '../play/content/playground-layout';

/** Public DEV controls are the only write boundary; tests operate these same controls. */

export function installPlaygroundEditor(scene: PlaygroundScene) {
  const variant = element<HTMLSelectElement>('spawn-variant');
  const surface = element<HTMLSelectElement>('spawn-surface');
  const x = element<HTMLInputElement>('spawn-x');
  const y = element<HTMLInputElement>('spawn-y');
  const target = element<HTMLSelectElement>('playground-target');
  const recipe = element<HTMLTextAreaElement>('layout-json');
  const message = element<HTMLElement>('editor-message');
  const abort = new AbortController();
  let current: PlaygroundSnapshot | undefined;
  let generation = -1;
  let desiredTarget: string | undefined;

  variant.replaceChildren(
    ...Object.entries(OBJECTS).map(
      ([id, definition]) => new Option(`${definition.kind} · ${id}`, id),
    ),
  );
  variant.value = 'blue-vase';
  const execute = (action: (layout: RoomDefinition) => RoomDefinition) => {
    if (!current) return;

    try {
      desiredTarget = undefined;
      const selectedId = selected()?.id;
      const layout = action(current.layout);

      if (!desiredTarget && layout.objects.some((entry) => entry.id === selectedId))
        desiredTarget = selectedId;

      scene.replaceLayout(layout);
      message.textContent = 'Aufbau übernommen. Der Versuch startet mit den neuen Startpositionen.';
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : 'Ungültiger Aufbau.';
    }
  };

  const placement = (id = variant.value): ObjectInstance['placement'] =>
    ['picture', 'curtain'].includes(OBJECTS[id].kind)
      ? { mode: 'area', x: x.valueAsNumber, y: y.valueAsNumber }
      : { mode: 'surface', x: x.valueAsNumber, surfaceId: surface.value };
  const selected = () =>
    current?.layout.objects.find((entry) => `object:${entry.id}` === target.value);
  const editSelected = () => {
    const object = selected();

    element<HTMLButtonElement>('object-move').disabled = element<HTMLButtonElement>(
      'object-remove',
    ).disabled = !object;

    if (!object) return;
    variant.value = object.variant;
    x.value = String(object.placement.x);
    y.value = String(object.placement.mode === 'area' ? object.placement.y : 0);

    if (object.placement.mode === 'surface') surface.value = object.placement.surfaceId;
    updatePlacement();
  };

  const updatePlacement = () => {
    const area = ['picture', 'curtain'].includes(OBJECTS[variant.value].kind);

    y.disabled = !area;
    surface.disabled = area;
  };

  const on = (id: string, action: () => void) =>
    element<HTMLElement>(id).addEventListener('click', action, { signal: abort.signal });

  on('object-spawn', () =>
    execute((layout) =>
      spawnPlaygroundObject(layout, {
        id: (desiredTarget = nextId(layout)),
        variant: variant.value,
        placement: placement(),
      }),
    ),
  );
  on('object-move', () =>
    execute((layout) =>
      movePlaygroundObject(layout, selected()?.id ?? '', placement(selected()?.variant)),
    ),
  );
  on('object-remove', () =>
    execute((layout) => removePlaygroundObject(layout, selected()?.id ?? '')),
  );
  on('layout-load', () =>
    execute(() => {
      if (recipe.value.length > 100_000) throw new Error('Aufbau ist zu groß.');

      return buildPlaygroundRecipe(JSON.parse(recipe.value) as PlaygroundRecipe);
    }),
  );
  on('layout-copy', () => {
    if (current) recipe.value = JSON.stringify(recipeForPlayground(current.layout), null, 2);
  });
  target.addEventListener('change', editSelected, { signal: abort.signal });
  variant.addEventListener('change', updatePlacement, { signal: abort.signal });
  updatePlacement();

  return {
    render(snapshot: PlaygroundSnapshot) {
      current = snapshot;

      if (generation === snapshot.generation) return;
      generation = snapshot.generation;
      surface.replaceChildren(
        new Option('Boden', snapshot.layout.floor.id),
        ...snapshot.layout.platforms.map((entry) => new Option(entry.id, entry.id)),
        ...snapshot.layout.objects
          .filter((entry) => OBJECTS[entry.variant].kind === 'couch')
          .map((entry) => new Option(entry.id, entry.id)),
      );

      if (desiredTarget && snapshot.layout.objects.some((entry) => entry.id === desiredTarget))
        target.value = `object:${desiredTarget}`;
      desiredTarget = undefined;
      editSelected();
    },
    destroy: () => abort.abort(),
  };
}

function element<T extends HTMLElement>(id: string) {
  const found = document.getElementById(id);

  if (!found) throw new Error(`Editorfeld fehlt: ${id}`);

  return found as T;
}

function nextId(layout: RoomDefinition) {
  let index = 1;

  while (layout.objects.some((entry) => entry.id === `spawn-${index}`)) index++;

  return `spawn-${index}`;
}
