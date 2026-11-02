/** Immutable observation contract; never exposes Phaser objects or state setters. */
export interface GameTestState {
  readonly ready: boolean;
  readonly scene: string;
  readonly frame: number;
  readonly room: { readonly width: number; readonly height: number };
  readonly camera: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly zoom: number };
  readonly pixel: {
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
