import type { ChaosEvent, DamageKind } from '../../game/domain/chaos-event.ts';
export interface AlbumEntry {
  readonly id: string;
  readonly asset: string;
  readonly condition: { readonly kind: DamageKind; readonly stage: number };
  readonly fluff: { readonly de: string; readonly en: string };
  readonly sara: { readonly de: string; readonly en: string };
}
export type AlbumCatalog = Readonly<Record<string, AlbumEntry>>;
export interface AlbumDiscovery {
  readonly entryId: string;
  readonly objectId: string;
  readonly eventId: string;
}
/** Eine Ereignisgrenze für #210, kein zusätzlicher Fortschritts- oder Persistenzspeicher. */
export function albumDiscovery(
  event: ChaosEvent,
  variant: string,
  catalog: AlbumCatalog,
): AlbumDiscovery | null {
  if (!Object.hasOwn(catalog, variant)) return null;
  const entry = catalog[variant];

  if (event.kind !== entry.condition.kind || event.stage !== entry.condition.stage) return null;

  return Object.freeze({ entryId: entry.id, objectId: event.objectId, eventId: event.id });
}
