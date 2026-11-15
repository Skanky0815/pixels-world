export type QaScope = 'none' | 'landing' | 'play' | 'both' | 'smoke' | 'all';

// Cross-area specs include actual entry/navigation or shared publication contracts.
export const landingSpecs = ['emoji-download', 'help', 'landing-metadata'];
export const integrationSpecs = ['build-isolation', 'footer', 'landing', 'legal'];
export const playSpecs = [
  'achievements',
  'age-rating',
  'album',
  'album-landscape',
  'album-reset',
  'ball-play',
  'books',
  'camera-dialogue',
  'carpet',
  'content',
  'couch',
  'curtain',
  'damage-dialogue',
  'desktop-camera',
  'dev-viewer',
  'dialogue-portraits',
  'dialogue-side',
  'difficulty',
  'difficulty-help',
  'dishes',
  'feedback',
  'follow-camera',
  'food-bag',
  'fridge',
  'game-debug',
  'game-feedback',
  'hard-shelves',
  'herbs',
  'hud',
  'kitchen',
  'kitchen-preview',
  'kitchen-standing',
  'lifecycle',
  'loading',
  'localization',
  'main-goal',
  'movement',
  'object-chain',
  'object-impact-cases',
  'pantry',
  'pause',
  'peaceful-goal',
  'pictures',
  'pixel-return',
  'plant',
  'playground',
  'pwa',
  'pwa-update',
  'readable-desktop',
  'reconciliation',
  'rendering',
  'responsive',
  'room-selection',
  'round',
  'sara-dialogue',
  'shelves',
  'spawn-slots',
  'start-screen',
  'storage-choices',
  'tablecloth',
  'tablet-layout',
  'touch',
  'trash-bin',
  'vases',
];

const landingFiles = [...landingSpecs, ...integrationSpecs];
const landingTitles = new RegExp(String.raw`(?:^|[\\/ ])(?:${landingFiles.join('|')})\.spec\.ts`);

function specPattern(names: string[]) {
  return new RegExp(`(?:^|[/\\\\])(?:${names.join('|')})\\.spec\\.ts$`);
}

/** One registry drives both changed-test classification and Playwright selection. */
export function specArea(name: string): QaScope {
  if (landingSpecs.includes(name)) return 'landing';

  if (integrationSpecs.includes(name)) return 'both';

  return playSpecs.includes(name) ? 'play' : 'all';
}

// eslint-disable-next-line max-lines-per-function -- Die deklarativen Profilfälle bilden gemeinsam den Auswahlvertrag für Playwright.
export function browserProfile(scope = 'all') {
  if (scope === 'all') return {};

  if (scope === 'landing') return { testMatch: specPattern(landingFiles) };

  if (scope === 'play')
    return {
      testMatch: specPattern([...playSpecs, ...integrationSpecs]),
      grep: /@smoke|@integration/,
    };

  if (scope === 'both' || scope === 'smoke')
    return {
      grep: new RegExp(`@smoke|@integration|${landingTitles.source}`),
    };

  throw new Error(`Unbekanntes Browserprofil: ${scope}`);
}
