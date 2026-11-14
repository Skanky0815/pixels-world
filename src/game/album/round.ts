import type { AlbumCollection } from './collection.ts';
import type { RoundResult } from '../domain/round-result.ts';

const EMPTY: readonly string[] = Object.freeze([]);

/** Scene-owned provisional discoveries never enter storage or the album view. */
export class RoundAlbum {
  private readonly pending = new Set<string>();
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

  /** Resolve once: success commits the batch, failed reconciliation discards it. */
  confirm(result: RoundResult | null) {
    if (!result) return EMPTY;

    if (this.confirmed) return this.confirmed;
    this.confirmed = EMPTY;

    if (result.outcome === 'success') this.confirmed = this.collection.unlockAll(this.pending);

    if (this.collection.snapshot().storage === 'ready') this.saved = this.confirmed;
    this.pending.clear();

    return this.confirmed;
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
