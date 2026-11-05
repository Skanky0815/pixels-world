import type { ChaosEvent, DamageHistory } from '../domain/chaos-event.ts';
import type { InputState } from '../input/input-state';

export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export type GroundAction = 'idle' | 'scratching' | 'nibbling' | 'wobbling';
export interface InteractionContext {
  readonly time: number;
  readonly delta: number;
  readonly input: InputState;
  readonly pixel: {
    readonly x: number;
    readonly y: number;
    readonly bottom: number;
    readonly left: number;
    readonly top: number;
    readonly bodyWidth: number;
    readonly bodyHeight: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly grounded: boolean;
    readonly climbing: boolean;
    readonly animationFrame: number;
  };
}
export interface ObjectLifecycle {
  reset(): void;
  destroy(): void;
}
export interface Destructible {
  readonly id: string;
  readonly maximumScore: number;
  damageSnapshot(): ReturnType<DamageHistory['snapshot']>;
}
export interface InteractionResult {
  readonly action: GroundAction;
  readonly faceX?: number;
  readonly event?: ChaosEvent;
}
export interface Interactable extends ObjectLifecycle {
  readonly id: string;
  eligible(context: InteractionContext): boolean;
  update(context: InteractionContext, active: boolean): InteractionResult;
}
export interface Climbable extends ObjectLifecycle {
  readonly id: string;
  readonly climbArea: Bounds;
  updateClimb(context: InteractionContext, attached: boolean): ChaosEvent | undefined;
}

/** Stable priority: overlapping targets never advance two automatic ground actions. */
export function updateGroundInteractions(
  objects: readonly Interactable[],
  context: InteractionContext,
): InteractionResult {
  const target = objects.find((object) => object.eligible(context));
  let result: InteractionResult = { action: 'idle' };

  for (const object of objects) {
    const update = object.update(context, object === target);

    if (object === target) result = update;
  }

  return result;
}

export function overlaps(pixel: InteractionContext['pixel'], area: Bounds) {
  return (
    pixel.bodyWidth > 0 &&
    pixel.bodyHeight > 0 &&
    area.width > 0 &&
    area.height > 0 &&
    pixel.left + pixel.bodyWidth >= area.x &&
    pixel.left <= area.x + area.width &&
    pixel.top + pixel.bodyHeight >= area.y &&
    pixel.top <= area.y + area.height
  );
}

export function standingStill(context: InteractionContext) {
  return (
    context.pixel.grounded &&
    !context.pixel.climbing &&
    !context.input.active &&
    Math.abs(context.pixel.velocityX) < 1 &&
    Math.abs(context.pixel.velocityY) < 1
  );
}
