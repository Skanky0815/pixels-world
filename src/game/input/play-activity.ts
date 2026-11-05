/** Browser lifecycle boundary. No background time is carried into a resumed frame. */
export class PlayActivity {
  private focused = document.hasFocus();
  private discardDelta = true;
  private readonly blur = () => this.setFocus(false);
  private readonly focus = () => this.setFocus(true);
  private readonly visibility = () => this.notify();

  private readonly changed: () => void;

  constructor(changed: () => void) {
    this.changed = changed;
    window.addEventListener('blur', this.blur);
    window.addEventListener('focus', this.focus);
    document.addEventListener('visibilitychange', this.visibility);
  }

  get active() {
    return this.focused && !document.hidden;
  }

  delta(deltaMs: number) {
    if (!this.active) return 0;

    if (this.discardDelta) {
      this.discardDelta = false;

      return 0;
    }

    return Number.isFinite(deltaMs) ? Math.min(100, Math.max(0, deltaMs)) : 0;
  }

  private setFocus(focused: boolean) {
    this.focused = focused;
    this.notify();
  }

  private notify() {
    this.discardDelta = true;
    this.changed();
  }

  destroy() {
    window.removeEventListener('blur', this.blur);
    window.removeEventListener('focus', this.focus);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
