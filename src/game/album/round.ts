import { destructionTarget, type DestructionTarget } from '../../content/achievements.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import type { AlbumCollection } from './collection.ts';
import type { RoundResult } from '../domain/round-result.ts';

const EMPTY: readonly string[] = Object.freeze([]);

/** Scene-owned provisional discoveries never enter storage or the album view. */
export class RoundAlbum {
  private readonly pending = new Set<string>();
  private readonly ruined = new Set<DestructionTarget>();
  private readonly variants = new Set<string>();
  private banners: readonly string[] = EMPTY;
  private saved: readonly string[] = EMPTY;
  private confirmed: readonly string[] | null = null;
  private readonly collection: AlbumCollection;

  constructor(collection: AlbumCollection) {
    this.collection = collection;
  }

  record(id: string) {
    if (this.confirmed || !this.collection.canUnlock(id) || this.pending.has(id)) return false;
    this.pending.add(id);

    return true;
  }

  recordDamage(event: ChaosEvent, object?: string, variant?: string) {
    const target = destructionTarget(event, object);

    if (this.confirmed || !target) return;
    this.ruined.add(target);

    if (variant) this.variants.add(variant);
  }

  /** Resolve once: success commits the batch, failed reconciliation discards it. */
  // eslint-disable-next-line max-lines-per-function -- Bestätigung und gemeinsames Verwerfen aller rundenbezogenen Vormerkungen bilden eine Transaktion.
  confirm(result: RoundResult | null) {
    if (!result) return EMPTY;

    if (this.confirmed) return this.confirmed;
    this.confirmed = EMPTY;

    if (result.outcome === 'success') this.commit(result);

    if (this.collection.snapshot().storage === 'ready') this.saved = this.confirmed;
    this.pending.clear();
    this.ruined.clear();
    this.variants.clear();

    return this.confirmed;
  }

  // eslint-disable-next-line max-lines-per-function -- Alle bestätigten Funde und Erfolge teilen dieselbe dauerhafte Bannerentscheidung.
  private commit(result: RoundResult) {
    const batch = this.collection.completeRound(
      this.pending,
      this.ruined,
      !result.peaceful,
      this.variants,
    );

    this.confirmed = batch.entries;

    if (this.collection.snapshot().storage === 'ready')
      this.banners = Object.freeze([...batch.entries, ...batch.achievements]);
  }

  savedBanners() {
    return this.banners;
  }

  savedDiscoveries() {
    return this.saved;
  }

  snapshot() {
    return Object.freeze({
      pending: Object.freeze([...this.pending]),
      confirmed: this.confirmed ?? EMPTY,
      completed: this.confirmed !== null,
    });
  }
}
