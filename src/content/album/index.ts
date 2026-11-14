import { GOAL_ALBUM } from './goals.ts';
import type { ResolvedGoal } from '../../game/domain/main-goal.ts';
import type { ChaosEvent } from '../../game/domain/chaos-event.ts';
import { OBJECTS } from '../objects/catalog.ts';
import type { ObjectCatalog } from '../../game/content/definitions.ts';
import { albumDiscovery, type AlbumEntry, type AlbumCatalog } from './discovery.ts';

function collectEntries(objects: ObjectCatalog): AlbumCatalog {
  return Object.fromEntries(
    Object.entries(objects).flatMap(([variant, definition]) =>
      definition.album ? [[variant, definition.album]] : [],
    ),
  );
}

export const INTERACTABLE_ALBUM: AlbumCatalog = { ...collectEntries(OBJECTS), ...GOAL_ALBUM };

// eslint-disable-next-line max-lines-per-function -- Das friedliche Zielereignis wird vollständig ohne Schadenswert an denselben Albumvertrag übergeben.
export function discoverGoalAlbum(goal: ResolvedGoal) {
  if (!goal.albumVariant) return null;

  return albumDiscovery(
    {
      id: JSON.stringify([goal.id, 'goal-reached']),
      objectId: goal.id,
      kind: 'goal-reached',
      stage: 1,
    },
    goal.albumVariant,
    GOAL_ALBUM,
  );
}

export function discoverAlbum(event: ChaosEvent, variant: string) {
  return albumDiscovery(event, variant, INTERACTABLE_ALBUM);
}

/** Unreachable DEV-only variants must never block completion of the released collection. */
export function albumEntries(preview: boolean): readonly AlbumEntry[] {
  return Object.values(INTERACTABLE_ALBUM).filter(
    (entry: AlbumEntry) => preview || !entry.previewOnly,
  );
}
