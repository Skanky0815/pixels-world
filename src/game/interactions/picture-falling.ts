import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';
export const PICTURE_RULES = { wobbleMs: 500, fallMs: 650, points: 18 } as const;
export interface PictureRules {
  readonly wobbleMs: number;
  readonly fallMs: number;
  readonly points: number;
}
interface Contact {
  readonly grounded: boolean;
  readonly climbing: boolean;
  readonly velocityY: number;
  readonly touching: boolean;
}
/** A flight is armed by upward motion; landing or climbing ends it. Contact can count only once per jump. */
export class PictureFalling {
  private state: 'straight' | 'crooked' | 'falling' | 'fallen' = 'straight';
  private armed = false;
  private used = false;
  private elapsed = 0;
  private wobble = 0;
  private readonly id: string;
  private readonly rules: PictureRules;
  constructor(id: string, rules: PictureRules = PICTURE_RULES) {
    assertObjectId(id);
    validatePictureRules(rules);
    this.id = id;
    this.rules = { ...rules };
  }

  update(delta: number, contact: Contact) {
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    this.wobble = Math.max(0, this.wobble - step);

    if (this.state === 'falling') return this.advanceFall(step);

    if (this.state === 'fallen') return;

    this.observeFlight(contact);

    if (this.armed && !this.used && contact.touching) this.hit();
  }

  private observeFlight(contact: Contact) {
    if (contact.grounded || contact.climbing) {
      this.armed = false;
      this.used = false;
    } else if (contact.velocityY < -1) this.armed = true;
  }

  // eslint-disable-next-line max-lines-per-function -- Beide einmaligen Trefferstufen setzen ihren eigenen Animationsanker.
  private hit() {
    this.used = true;

    if (this.state === 'straight') {
      this.state = 'crooked';
      this.wobble = this.rules.wobbleMs;
    } else {
      this.state = 'falling';
      this.elapsed = 0;
      this.wobble = 0;
    }
  }

  private advanceFall(delta: number) {
    this.elapsed = Math.min(this.rules.fallMs, this.elapsed + delta);

    if (this.elapsed < this.rules.fallMs) return;
    this.state = 'fallen';

    return chaosEvent(this.id, 'picture-fall', 1, this.rules.points);
  }

  snapshot() {
    return {
      state: this.state,
      progress: this.elapsed / this.rules.fallMs,
      wobble: this.wobble / this.rules.wobbleMs,
    };
  }

  reset() {
    this.state = 'straight';
    this.armed = false;
    this.used = false;
    this.elapsed = 0;
    this.wobble = 0;
  }
}
export function validatePictureRules(rules: PictureRules) {
  if (
    ![rules.wobbleMs, rules.fallMs].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isSafeInteger(rules.points) ||
    rules.points < 0
  )
    throw new Error('Invalid picture rules');
}
