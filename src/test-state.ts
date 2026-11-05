import type { ResultViewSnapshot } from './game/ui/RoundResultView';
import type { ReconciliationSnapshot } from './game/domain/reconciliation';
import type { RoundSnapshot } from './game/domain/round-controller';
import type { HomecomingSnapshot, SaraAnimation } from './game/domain/homecoming';
import type { PixelReturnSnapshot } from './game/domain/pixel-return';

/** Immutable observation contract; never exposes Phaser objects or state setters. */
export interface GameTestState {
  readonly result: ResultViewSnapshot;
  readonly charmDisplay: { readonly heartsText: string };
  readonly reconciliation: ReconciliationSnapshot;
  readonly round: RoundSnapshot;
  readonly homecoming: HomecomingSnapshot;
  readonly pixelReturn: PixelReturnSnapshot;
  readonly sara: {
    readonly visible: boolean;
    readonly animationKey: SaraAnimation;
    readonly x: number;
    readonly soleY: number;
    readonly texture: string;
    readonly frame: number;
    readonly displayHeight: number;
    readonly originY: number;
    readonly dialogueText: string;
  };
  readonly active: boolean;
  readonly ready: boolean;
  readonly generation: number;
  readonly blurListeners: number;
  readonly scene: string;
  readonly frame: number;
  readonly room: { readonly id: string; readonly width: number; readonly height: number };
  readonly camera: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly zoom: number;
  };
  readonly chaos: {
    readonly score: number;
    readonly damagedObjects: number;
    readonly anger: string;
  };
  readonly hud: {
    readonly roundText: string;
    readonly statusText: string;
    readonly scoreText: string;
    readonly climbHintText: string;
    readonly climbHintAlpha: number;
    readonly angerRatio: number;
    readonly angerColor: number;
    readonly elements: number;
  };
  readonly objects: ReadonlyArray<{
    readonly id: string;
    readonly kind: string;
    readonly variant: string;
    readonly damage: number;
    readonly events: number;
    readonly lastDamage: {
      readonly id: string;
      readonly objectId: string;
      readonly kind: string;
      readonly stage: number;
      readonly value: number;
    } | null;
  }>;
  readonly vases: ReadonlyArray<{
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly bottom: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly state: string;
    readonly points: number;
  }>;
  readonly curtain: {
    readonly state: string;
    readonly damage: number;
    readonly events: number;
    readonly lastDamage: {
      readonly id: string;
      readonly objectId: string;
      readonly kind: string;
      readonly stage: number;
      readonly value: number;
    } | null;
  } | null;
  readonly plant: {
    readonly state: string;
    readonly damage: number;
    readonly progress: number;
    readonly angle: number;
    readonly events: number;
    readonly lastDamage: {
      readonly id: string;
      readonly objectId: string;
      readonly kind: string;
      readonly stage: number;
      readonly value: number;
    } | null;
  } | null;
  readonly couch: {
    readonly state: string;
    readonly damage: number;
    readonly events: number;
    readonly lastDamage: {
      readonly id: string;
      readonly objectId: string;
      readonly kind: string;
      readonly stage: number;
      readonly value: number;
    } | null;
  } | null;
  readonly pixel: {
    readonly animation: string | null;
    readonly animationFrame: number;
    readonly flipX: boolean;
    readonly texture: string;
    readonly x: number;
    readonly y: number;
    readonly bottom: number;
    readonly left: number;
    readonly top: number;
    readonly bodyWidth: number;
    readonly bodyHeight: number;
    readonly displayWidth: number;
    readonly displayHeight: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly grounded: boolean;
    readonly climbing: boolean;
    readonly gravity: boolean;
  };
}

declare global {
  interface Window {
    readonly __pixelTest?: GameTestState;
  }
}
