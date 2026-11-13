type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const STORAGE_CHOICE_KEY = 'pixels-world.storage';
export type StorageFeature = 'album' | 'offline';

/** Only an explicit feature choice is retained; no identifier or history. */
export class StorageChoices {
  private value = { album: false, offline: false };
  private readonly listeners = new Set<() => void>();

  private readonly storage?: StoragePort;

  constructor(storage?: StoragePort) {
    this.storage = storage;

    try {
      this.restore(storage?.getItem(STORAGE_CHOICE_KEY) ?? null);
    } catch {
      /* Blocked storage keeps optional features off. */
    }
  }

  restore(raw: string | null) {
    try {
      const saved = JSON.parse(raw ?? '{}');

      this.value = { album: saved?.album === true, offline: saved?.offline === true };
    } catch {
      this.value = { album: false, offline: false };
    }

    for (const listener of this.listeners) listener();
  }

  snapshot() {
    return Object.freeze({ ...this.value });
  }

  set(feature: StorageFeature, enabled: boolean) {
    this.value = { ...this.value, [feature]: enabled };

    try {
      this.storage?.setItem(STORAGE_CHOICE_KEY, JSON.stringify(this.value));
    } catch {
      /* The explicit choice still applies for this page. */
    }

    for (const listener of this.listeners) listener();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

function browserStorage() {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export const storageChoices = new StorageChoices(browserStorage());

if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_CHOICE_KEY || event.key === null)
      storageChoices.restore(event.newValue);
  });
