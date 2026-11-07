import type { FixedGoalSpawnProfile } from '../content/spawn-profile.ts';
import type { Bounds } from '../interactions/contracts.ts';
import type { RoundEndReason } from './round-controller.ts';

export interface GoalDefinition {
  readonly spawn: FixedGoalSpawnProfile;
  readonly id: string;
  readonly kind: 'toy';
  readonly label: string;
  readonly motivation: string;
  readonly surfaceId: string;
  readonly x: number;
  readonly dwellMs: number;
}
export interface ResolvedGoal extends GoalDefinition {
  readonly area: Bounds;
  readonly surfaceY: number;
}
export interface GoalContact {
  readonly x: number;
  readonly left: number;
  readonly bodyWidth: number;
  readonly bottom: number;
  readonly grounded: boolean;
  readonly climbing: boolean;
  readonly velocityX: number;
}

/** One fixed goal; interaction progress is separate from points and round timing. */
export class MainGoal {
  private status: 'active' | 'reached' | 'missed' = 'active';
  private progressMs = 0;
  private readonly definition: ResolvedGoal;

  constructor(definition: ResolvedGoal) {
    this.definition = definition;
  }

  advance(deltaMs: number, contact: GoalContact, inputActive: boolean) {
    if (this.status !== 'active' || !Number.isFinite(deltaMs) || deltaMs <= 0) return false;

    if (inputActive || !this.touching(contact)) this.progressMs = 0;
    else this.progressMs = Math.min(this.definition.dwellMs, this.progressMs + deltaMs);

    return this.progressMs === this.definition.dwellMs;
  }

  // eslint-disable-next-line max-lines-per-function -- Auflage, Stillstand und Zielüberschneidung bilden ein gemeinsames geometrisches Kontaktprädikat.
  private touching(contact: GoalContact) {
    const { area, surfaceY } = this.definition;

    return (
      contact.grounded &&
      !contact.climbing &&
      Math.abs(contact.velocityX) < 1 &&
      Math.abs(contact.bottom - surfaceY) < 3 &&
      contact.left + contact.bodyWidth >= area.x &&
      contact.left <= area.x + area.width
    );
  }

  finish(reason: RoundEndReason) {
    if (this.status !== 'active') return;
    this.status = reason === 'goal' ? 'reached' : 'missed';
  }

  snapshot() {
    return Object.freeze({
      id: this.definition.id,
      label: this.definition.label,
      motivation: this.definition.motivation,
      status: this.status,
      progress: this.progressMs / this.definition.dwellMs,
    });
  }
}
