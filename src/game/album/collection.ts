import { AchievementProgress } from './achievements.ts';
import { decodeAlbum } from './storage-codec.ts';
import type { DestructionTarget } from '../../content/achievements.ts';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const ALBUM_STORAGE_KEY = 'pixels-world.album';
export type AlbumStorageStatus = 'session' | 'ready' | 'unavailable' | 'recovered' | 'newer';

/** IDs describe variants, never room instances or scoring events. */
export class AlbumCollection {
  private readonly achievements = new AchievementProgress();
  private readonly found = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private status: AlbumStorageStatus = 'ready';

  private remember: boolean;
  private readonly ids: ReadonlySet<string>;
  private readonly storage?: StoragePort;

  constructor(ids: ReadonlySet<string>, storage?: StoragePort, remember = true) {
    this.remember = remember;
    this.ids = ids;
    this.storage = storage;

    if (remember) this.restore();
  }

  setRemember(enabled: boolean) {
    if (this.remember === enabled) return;
    this.remember = enabled;
    this.status = 'ready';

    if (enabled) this.restore();
    this.changed();
  }

  snapshot() {
    return Object.freeze({
      discovered: Object.freeze([...this.found]),
      storage: this.remember ? this.status : 'session',
    });
  }

  unlock(id: string) {
    return this.unlockAll([id]).length > 0;
  }

  canUnlock(id: string) {
    return this.ids.has(id) && !this.found.has(id);
  }

  /** One complete snapshot, one write and one notification for a finished round. */
  unlockAll(ids: Iterable<string>) {
    const added = [...new Set(ids)].filter((id) => this.canUnlock(id));

    if (!added.length) return Object.freeze(added);

    for (const id of added) this.found.add(id);
    this.changed();

    return Object.freeze(added);
  }

  achievementSnapshot() {
    return this.achievements.snapshot();
  }

  completeRound(ids: Iterable<string>, targets: Iterable<DestructionTarget>, reconciled: boolean) {
    const added = [...new Set(ids)].filter((id) => this.canUnlock(id));
    const before = this.achievements.snapshot();
    const earned = this.achievements.confirm(reconciled, targets);

    for (const id of added) this.found.add(id);

    if (added.length || JSON.stringify(before) !== JSON.stringify(this.achievements.snapshot()))
      this.changed();

    return Object.freeze({ entries: Object.freeze(added), achievements: earned });
  }

  reset() {
    this.found.clear();
    this.achievements.reset();
    this.status = 'ready';

    if (!this.remember) this.save(true);
    this.changed();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private changed() {
    this.save();

    for (const listener of this.listeners) listener();
  }

  private read() {
    try {
      if (!this.storage) throw new Error('Storage unavailable');

      return this.storage.getItem(ALBUM_STORAGE_KEY);
    } catch {
      this.status = 'unavailable';

      return null;
    }
  }

  // eslint-disable-next-line max-lines-per-function -- Wiederherstellung, Migration und Schutz neuerer Versionen bilden eine atomare Speichergrenze.
  private restore() {
    const raw = this.read();

    if (!raw) return;

    try {
      const data = decodeAlbum(raw);

      if (!data) {
        this.status = 'newer';

        return;
      }

      this.achievements.restore(data.achievements);

      if (data.recovered) this.status = 'recovered';

      for (const id of data.entries) if (this.ids.has(id)) this.found.add(id);

      if (data.migrate) this.save();
    } catch {
      this.status = 'recovered';
    }
  }

  // eslint-disable-next-line max-lines-per-function -- Ein Speicherversuch darf den sitzungsweiten Fortschritt bei blockiertem Storage nicht verlieren.
  private save(force = false) {
    if ((!this.remember && !force) || this.status === 'newer') return;

    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.setItem(
        ALBUM_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          discovered: [...this.found],
          achievements: this.achievements.snapshot(),
        }),
      );
      this.achievements.markSaved();
      this.status = 'ready';
    } catch {
      this.status = 'unavailable';
    }
  }
}
