/** A reset cannot turn an operating-system repeat into a fresh gameplay press. */
export class KeyboardRelease {
  private readonly held = new Set<string>();
  private readonly blocked = new Set<string>();

  down(code: string, repeat: boolean) {
    if (repeat && !this.held.has(code)) this.blocked.add(code);
    this.held.add(code);
  }

  up(code: string) {
    this.held.delete(code);
    this.blocked.delete(code);
  }

  release() {
    for (const code of this.held) this.blocked.add(code);
  }

  blur() {
    this.held.clear();
    this.blocked.clear();
  }

  allows(code: string) {
    return !this.blocked.has(code);
  }
}
