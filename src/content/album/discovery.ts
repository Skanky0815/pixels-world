import type { ChaosEvent, DamageKind } from '../../game/domain/chaos-event.ts';
export type AlbumRoom = 'living-room' | 'kitchen' | 'bedroom' | 'study';
export interface AlbumEntry {
  readonly id: string;
  readonly asset: string;
  readonly name: { readonly de: string; readonly en: string };
  readonly previewOnly?: boolean;
  readonly rooms: readonly AlbumRoom[];
  readonly condition: { readonly kind: DamageKind | 'goal-reached'; readonly stage: number };
  readonly fluff: { readonly de: string; readonly en: string };
  readonly sara: { readonly de: string; readonly en: string };
}
export interface DamageAlbumEntry extends AlbumEntry {
  readonly condition: { readonly kind: DamageKind; readonly stage: number };
}
export interface GoalAlbumEntry extends AlbumEntry {
  readonly condition: { readonly kind: 'goal-reached'; readonly stage: number };
}
export type AlbumCatalog = Readonly<Record<string, AlbumEntry>>;
export interface AlbumDiscovery {
  readonly entryId: string;
  readonly objectId: string;
  readonly eventId: string;
}
type AlbumTrigger = Pick<ChaosEvent, 'id' | 'objectId' | 'stage'> & {
  readonly kind: DamageKind | 'goal-reached';
};

/** Eine Ereignisgrenze für #210, kein zusätzlicher Fortschritts- oder Persistenzspeicher. */
export function albumDiscovery(
  event: AlbumTrigger,
  variant: string,
  catalog: AlbumCatalog,
): AlbumDiscovery | null {
  if (!Object.hasOwn(catalog, variant)) return null;
  const entry = catalog[variant];

  if (event.kind !== entry.condition.kind || event.stage !== entry.condition.stage) return null;

  return Object.freeze({ entryId: entry.id, objectId: event.objectId, eventId: event.id });
}
