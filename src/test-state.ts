/** Immutable observation contract; never exposes Phaser objects or state setters. */
export interface GameTestState {
  readonly ready: boolean;
  readonly scene: string;
  readonly frame: number;
  readonly room: { readonly width: number; readonly height: number };
  readonly camera: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly zoom: number };
  readonly chaos: { readonly score: number; readonly damagedObjects: number; readonly anger: string };
  readonly vases: ReadonlyArray<{
    readonly id: string; readonly x: number; readonly y: number; readonly bottom: number;
    readonly velocityX: number; readonly velocityY: number;
    readonly state: string; readonly points: number;
  }>;
  readonly couch: {
    readonly state: string; readonly damage: number; readonly events: number;
    readonly lastDamage: { readonly objectId: string; readonly kind: string; readonly stage: number; readonly value: number } | null;
  };
  readonly pixel: {
    readonly animation: string | null;
    readonly texture: string;
    readonly x: number;
    readonly y: number;
    readonly bottom: number;
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
