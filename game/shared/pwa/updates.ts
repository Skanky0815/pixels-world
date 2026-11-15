import { UpdateConsent } from './update-consent.ts';

export type UpdateStatus =
  'unavailable' | 'idle' | 'checking' | 'current' | 'offline' | 'error' | 'ready' | 'applying';
export interface UpdatePort {
  check(): Promise<boolean>;
  activate(): Promise<void>;
  online(): boolean;
}

/** Session-only update state; saved game data never participates in activation. */
export class GameUpdates {
  private port?: UpdatePort;
  private status: UpdateStatus = 'unavailable';
  private available = false;
  private pending?: Promise<void>;
  private lastCheck = -Infinity;
  private readonly listeners = new Set<() => void>();
  private readonly consent: UpdateConsent;

  constructor(reload: () => void) {
    this.consent = new UpdateConsent(reload);
  }

  connect(port: UpdatePort) {
    this.port = port;
    this.setStatus(this.available ? 'ready' : 'idle');
  }

  snapshot() {
    return Object.freeze({ status: this.status, available: this.available });
  }

  ready() {
    this.available = true;

    if (this.status !== 'applying') this.setStatus('ready');
  }

  activated() {
    this.ready();
    this.consent.controllerChanged();
  }

  check(manual = false, now = Date.now()) {
    if (!this.port || this.blocked()) return Promise.resolve();

    if (this.pending) return this.pending;

    if (!manual && now - this.lastCheck < 60_000) return Promise.resolve();
    this.lastCheck = now;
    this.pending = this.performCheck(this.port).finally(() => {
      this.pending = undefined;
    });

    return this.pending;
  }

  private async performCheck(port: UpdatePort) {
    if (!port.online()) return this.setStatus('offline');
    this.setStatus('checking');

    try {
      if (await port.check()) this.ready();
      else if (!this.available) this.setStatus('current');
    } catch {
      if (!this.available) this.setStatus(port.online() ? 'error' : 'offline');
    }
  }

  async apply() {
    const port = this.port;

    if (!port || !this.available || this.status === 'applying') return;
    this.setStatus('applying');

    try {
      await this.consent.confirm(() => port.activate());
    } catch {
      this.setStatus('error');
    }
  }

  private blocked() {
    return this.status === 'applying' || this.available;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    listener();

    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: UpdateStatus) {
    this.status = status;

    for (const listener of this.listeners) listener();
  }
}

export const gameUpdates = new GameUpdates(() => location.reload());
