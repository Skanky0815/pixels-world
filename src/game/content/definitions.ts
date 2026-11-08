import type { AlbumEntry } from '../../content/album/discovery.ts';
import type { CarpetConfig } from '../objects/Carpet.ts';
import type { CarpetRules } from '../interactions/carpet-hairball.ts';
import type { WallPictureConfig } from '../objects/WallPicture.ts';
import type { PictureMotif } from '../assets/picture-appearance.ts';
import type { PictureRules } from '../interactions/picture-falling.ts';
import type { WallSlots, WallPlacement } from './wall-slots.ts';
import type { SpawnSlot } from './spawn-slots.ts';
import type { SpawnProfile } from './spawn-profile.ts';
import type { ShelfStabilityConfig, ShelfClass } from '../domain/shelf-stability.ts';
import type { CouchAppearance } from '../assets/couch-appearance.ts';
import type { VaseAppearance } from '../assets/vase-appearance.ts';
import type { GoalDefinition, ResolvedGoal } from '../domain/main-goal.ts';
import type { AssetKey, DecorationAssetKey } from '../assets/definitions.ts';
import type { Bounds } from '../interactions/contracts.ts';
import type { ScratchConfig } from '../interactions/couch-scratching.ts';
import type { TearConfig } from '../interactions/curtain-sliding.ts';
import type { PlantConfig } from '../interactions/plant-nibbling.ts';
import type { CouchConfig } from '../objects/Couch.ts';
import type { CurtainConfig } from '../objects/Curtain.ts';
import type { PlantObjectConfig } from '../objects/Plant.ts';
import type { VaseConfig } from '../objects/Vase.ts';
import type { BookStackConfig } from '../objects/BookStack.ts';
import type { BookRules } from '../interactions/book-toppling.ts';
import type { BookAppearance } from '../objects/book-art.ts';

export type Capability = 'automatic' | 'damage' | 'platform' | 'climb' | 'push';
interface Base {
  readonly album?: AlbumEntry;
  readonly spawn: SpawnProfile;
  readonly capabilities: readonly Capability[];
}
export type ObjectDefinition =
  | (Base & {
      readonly kind: 'carpet';
      readonly asset: 'carpet-default';
      readonly geometry: { readonly width: number; readonly height: number };
      readonly rules: CarpetRules;
    })
  | (Base & {
      readonly kind: 'picture';
      readonly asset: 'wall-picture';
      readonly appearance: PictureMotif;
      readonly rules: PictureRules;
    })
  | (Base & {
      readonly kind: 'books';
      readonly asset: 'book-stack';
      readonly rules: BookRules;
      readonly appearance?: BookAppearance;
    })
  | (Base & {
      readonly kind: 'couch';
      readonly asset: 'couch-default';
      readonly appearance?: CouchAppearance;
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
      readonly appearance?: VaseAppearance;
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
  | { readonly kind: 'image'; readonly asset: DecorationAssetKey; readonly bounds: Bounds }
  | {
      readonly kind: 'rect';
      readonly bounds: Bounds;
      readonly color: number;
      readonly supportedBy?: string;
    }
  | {
      readonly kind: 'text';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly size: number;
      readonly color: number;
    };
export interface RoomDefinition {
  readonly wallSlots?: WallSlots;
  readonly wallPlacements?: readonly WallPlacement[];
  /** Freiräume für zusätzliche kollidierende Möbel und Wandregale. */
  readonly navigationClearances?: readonly Bounds[];
  readonly objectSlots?: readonly {
    readonly id: string;
    readonly count: Readonly<Record<'easy' | 'normal' | 'hard', number>>;
    readonly entries: readonly (SpawnSlot & { readonly surfaceId: string })[];
  }[];
  readonly environment?: 'cozy-room';
  readonly difficultyObjects?: {
    readonly easyOmit: readonly string[];
    readonly hardAdd: readonly ObjectInstance[];
    readonly hardPlatforms?: RoomDefinition['platforms'];
    readonly hardStability?: Readonly<Record<string, ShelfClass>>;
  };
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
    readonly durability?: ShelfStabilityConfig;
    readonly slots?: {
      readonly count: Readonly<Record<'easy' | 'normal' | 'hard', number>>;
      readonly entries: readonly SpawnSlot[];
    };
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
  | (ResolvedBase & { readonly kind: 'carpet'; readonly config: CarpetConfig })
  | (ResolvedBase & { readonly kind: 'picture'; readonly config: WallPictureConfig })
  | (ResolvedBase & { readonly kind: 'books'; readonly config: BookStackConfig })
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
