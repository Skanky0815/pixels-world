import type { GoalDefinition, ResolvedGoal } from '../domain/main-goal.ts';
import type { AssetKey } from '../assets/definitions.ts';
import type { Bounds } from '../interactions/contracts.ts';
import type { ScratchConfig } from '../interactions/couch-scratching.ts';
import type { TearConfig } from '../interactions/curtain-sliding.ts';
import type { PlantConfig } from '../interactions/plant-nibbling.ts';
import type { CouchConfig } from '../objects/Couch.ts';
import type { CurtainConfig } from '../objects/Curtain.ts';
import type { PlantObjectConfig } from '../objects/Plant.ts';
import type { VaseConfig } from '../objects/Vase.ts';

type Capability = 'automatic' | 'damage' | 'platform' | 'climb' | 'push';
interface Base {
  readonly capabilities: readonly Capability[];
}
export type ObjectDefinition =
  | (Base & {
      readonly kind: 'couch';
      readonly asset: 'couch-default';
      readonly geometry: {
        readonly width: number;
        readonly height: number;
        readonly seatRise: number;
      };
      readonly reach: number;
      readonly rules: ScratchConfig;
    })
  | (Base & {
      readonly kind: 'curtain';
      readonly asset: 'curtain-default';
      readonly geometry: { readonly width: number; readonly height: number };
      readonly rules: TearConfig;
    })
  | (Base & {
      readonly kind: 'plant';
      readonly asset: 'catgrass-default';
      readonly reach: { readonly left: number; readonly right: number };
      readonly rules: PlantConfig;
    })
  | (Base & {
      readonly kind: 'vase';
      readonly asset: 'vase-default';
      readonly points: number;
      readonly color: number;
    });
export type ObjectCatalog = Readonly<Record<string, ObjectDefinition>>;
export interface ObjectInstance {
  readonly id: string;
  readonly variant: string;
  readonly placement:
    | { readonly mode: 'surface'; readonly x: number; readonly surfaceId: string }
    | { readonly mode: 'area'; readonly x: number; readonly y: number };
}
export type Decoration =
  | { readonly kind: 'rect'; readonly bounds: Bounds; readonly color: number }
  | {
      readonly kind: 'text';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly size: number;
      readonly color: number;
    };
export interface RoomDefinition {
  readonly goal: GoalDefinition;
  readonly id: string;
  readonly caption: string;
  readonly width: number;
  readonly height: number;
  readonly pixelAsset: 'pixel';
  readonly spawn: { readonly x: number; readonly surfaceId: string };
  readonly wallColor: number;
  readonly floor: {
    readonly id: string;
    readonly y: number;
    readonly color: number;
    readonly plankColor: number;
    readonly plankWidth: number;
    readonly plankHeight: number;
  };
  readonly platforms: readonly {
    readonly id: string;
    readonly bounds: Bounds;
    readonly asset: 'wood-shelf';
  }[];
  readonly decorations: readonly Decoration[];
  readonly objects: readonly ObjectInstance[];
}
interface ResolvedBase {
  readonly id: string;
  readonly variant: string;
  readonly asset: AssetKey;
}
export type ResolvedObject =
  | (ResolvedBase & { readonly kind: 'couch'; readonly config: CouchConfig })
  | (ResolvedBase & { readonly kind: 'curtain'; readonly config: CurtainConfig })
  | (ResolvedBase & { readonly kind: 'plant'; readonly config: PlantObjectConfig })
  | (ResolvedBase & { readonly kind: 'vase'; readonly config: VaseConfig });
export interface ResolvedRoom {
  readonly goal: ResolvedGoal;
  readonly definition: RoomDefinition;
  readonly spawn: { readonly x: number; readonly bottom: number };
  readonly objects: readonly ResolvedObject[];
}
