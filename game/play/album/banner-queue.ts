/** One scene, one result, one presentation per confirmed unlock. */
export class AlbumBannerQueue {
  private entries: readonly string[] = [];
  private started = false;
  private elapsed = 0;

  start(entries: readonly string[]) {
    if (this.started) return false;
    this.started = true;
    this.entries = Object.freeze([...entries]);

    return true;
  }

  advance(elapsed: number) {
    if (Number.isFinite(elapsed) && elapsed > 0) this.elapsed += elapsed;
  }

  current() {
    return this.entries[Math.floor(this.elapsed / 3000)] ?? null;
  }
}
