import type { Pantry } from './objects/Pantry';
import type { Plant } from './objects/Plant';
import type { EndingAnimation } from './actors/sara-endings';
import type { EndingPresentation } from './domain/ending-presentation';
import type { Carpet } from './objects/Carpet';
import type { WallPicture } from './objects/WallPicture';
import type { AlbumDiscovery } from './content/album/discovery';
import type { RoundAlbum } from './album/round';
import type { WallPlacement } from './content/wall-slots';
import type { Shelf } from './objects/Shelf';
import type { Dish } from './objects/Dish';
import type { Tablecloth } from './objects/Tablecloth';
import type { TrashBin } from './objects/TrashBin';
import type { FoodBag } from './objects/FoodBag';
import type { BookStack } from './objects/BookStack';
import type { GoalView } from './ui/GoalView';
import type { Difficulty } from './content/difficulty';
import type { GameFeedback } from './ui/GameFeedback';
import type { MainGoal } from './domain/main-goal';
import type { FoodEating } from './domain/food-eating';
import type { BallPlay } from './domain/ball-play';
import type { ResultViewSnapshot } from './ui/RoundResultView';
import type { ReconciliationSnapshot } from './domain/reconciliation';
import type { RoundSnapshot } from './domain/round-controller';
import type { HomecomingSnapshot, SaraAnimation } from './domain/homecoming';
import type { PixelReturnSnapshot } from './domain/pixel-return';
import type { CharmPresentation } from './domain/charm-presentation';
import type { ImpactWorld } from './domain/impact-world';

/** Immutable observation contract; never exposes Phaser objects or state setters. */
export interface GameTestState {
  readonly carpets: readonly ReturnType<Carpet['snapshot']>[];
  readonly pictures: readonly ReturnType<WallPicture['snapshot']>[];
  readonly albumDiscovery: AlbumDiscovery | null;
  readonly album: ReturnType<RoundAlbum['snapshot']>;
  readonly wallPlacements: readonly WallPlacement[];
  readonly pantry: readonly ReturnType<Pantry['snapshot']>[];
  readonly plants: readonly ReturnType<Plant['supportedSnapshot']>[];
  readonly dishes: readonly ReturnType<Dish['snapshot']>[];
  readonly tablecloths: readonly ReturnType<Tablecloth['snapshot']>[];
  readonly trashBins: readonly ReturnType<TrashBin['snapshot']>[];
  readonly foodBags: readonly ReturnType<FoodBag['snapshot']>[];
  readonly books: readonly ReturnType<BookStack['snapshot']>[];
  readonly shelves: readonly ReturnType<Shelf['snapshot']>[];
  readonly goal: ReturnType<MainGoal['snapshot']>;
  readonly ballPlay: ReturnType<BallPlay['snapshot']>;
  readonly foodEating: ReturnType<FoodEating['snapshot']>;
  readonly goalView: ReturnType<GoalView['snapshot']>;
  readonly started: boolean;
  readonly difficulty: Difficulty;
  readonly intro: { readonly visible: boolean };
  readonly result: ResultViewSnapshot;
  readonly charmDisplay: {
    readonly heartsText: string;
    readonly canvasTextVisible: boolean;
    readonly dialogueBounds: Readonly<{ left: number; right: number }>;
    readonly portrait: Readonly<{ visible: boolean; texture: string; flipped: boolean }>;
  };
  readonly reconciliation: ReconciliationSnapshot;
  readonly charmMotion: ReturnType<CharmPresentation['snapshot']>;
  readonly ending: ReturnType<EndingPresentation['snapshot']>;
  readonly objectImpacts: ReturnType<ImpactWorld['snapshot']>;
  readonly round: RoundSnapshot;
  readonly homecoming: HomecomingSnapshot;
  readonly pixelReturn: PixelReturnSnapshot;
  readonly sara: {
    readonly flipX: boolean;
    readonly visible: boolean;
    readonly animationKey: SaraAnimation | EndingAnimation;
    readonly x: number;
    readonly soleY: number;
    readonly texture: string;
    readonly frame: number;
    readonly displayHeight: number;
    readonly originY: number;
    readonly dialogueText: string;
    readonly dialogueBounds: Readonly<{ left: number; right: number }>;
    readonly canvasTextVisible: boolean;
    readonly portrait: Readonly<{ visible: boolean; texture: string; flipped: boolean }>;
  };
  readonly active: boolean;
  readonly feedback: ReturnType<GameFeedback['snapshot']>;
  readonly audio: {
    readonly master: number;
    readonly effects: number;
    readonly volume: number;
    readonly paused: boolean;
  };
  readonly ready: boolean;
  readonly generation: number;
  readonly blurListeners: number;
  readonly scene: string;
  readonly frame: number;
  readonly room: {
    readonly physicsWidth: number;
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly artReady: boolean;
  };
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
    readonly angle: number;
    readonly texture: string;
    readonly bodyWidth: number;
    readonly bodyHeight: number;
    readonly shards: number;
    readonly shardPositions: readonly Readonly<{ x: number; y: number; angle: number }>[];
    readonly x: number;
    readonly y: number;
    readonly bottom: number;
    readonly velocityX: number;
    readonly velocityY: number;
    readonly state: string;
    readonly points: number;
  }>;
  readonly curtain: {
    readonly texture: string;
    readonly area: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };
    readonly marks: readonly { readonly x: number; readonly y: number }[];
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
    readonly texture: string;
    readonly soilVisible: boolean;
    readonly x: number;
    readonly y: number;
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
    readonly texture: string;
    readonly bodyWidth: number;
    readonly bodyHeight: number;
    readonly marks: readonly { readonly x: number; readonly y: number }[];
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
    readonly visualX: number;
    readonly visualY: number;
    readonly visualTexture: string;
    readonly visualFrame: number;
    readonly visualFlipX: boolean;
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
    readonly visible: boolean;
  };
}

declare global {
  interface Window {
    readonly __pixelTest?: GameTestState;
  }
}
