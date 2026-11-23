export type QaScope = 'none' | 'landing' | 'play' | 'both' | 'smoke' | 'integration' | 'all';
export type TestArea = 'landingpage' | 'play' | 'integration';

const coreIntegration = /@smoke|@integration/;
const landingIntegration = /@smoke|@integration|@landing-transition/;
const landingTitle = /(?:^|[\\/ ])landingpage[\\/]/;

function folders(...areas: TestArea[]) {
  return new RegExp(String.raw`(?:^|[\\/])(?:${areas.join('|')})[\\/].*\.spec\.ts$`);
}

const specPath = /^(landingpage|play|integration)\/(?:[^/]+\/)*[^/]+\.spec\.ts(?:$|-snapshots\/)/;
const areaScopes: Record<string, QaScope> = {
  landingpage: 'landing',
  play: 'play',
  integration: 'both',
};

export function specArea(path: string) {
  return areaScopes[specPath.exec(path)?.[1] ?? ''] ?? 'all';
}

function integrationGrep(origin: string) {
  return origin === 'play' ? coreIntegration : landingIntegration;
}

interface BrowserProfile {
  testMatch?: RegExp;
  grep?: RegExp;
}
const landingProfile = {
  testMatch: folders('landingpage', 'integration'),
  grep: new RegExp(`${landingTitle.source}|${landingIntegration.source}`),
};
const bothProfile = {
  testMatch: folders('landingpage', 'play', 'integration'),
  grep: new RegExp(`${landingTitle.source}|${landingIntegration.source}`),
};
const profiles: Record<string, BrowserProfile> = {
  all: {},
  landing: landingProfile,
  play: { testMatch: folders('play', 'integration'), grep: coreIntegration },
  both: bothProfile,
  smoke: bothProfile,
  'landing-only': { testMatch: folders('landingpage') },
  'landing-full': { testMatch: folders('landingpage') },
  'play-only': { testMatch: folders('play'), grep: /@smoke/ },
  'play-full': { testMatch: folders('play') },
  'integration-full': { testMatch: folders('integration') },
};

export function browserProfile(scope = 'all', origin = 'both'): BrowserProfile {
  const profile =
    scope === 'integration'
      ? { testMatch: folders('integration'), grep: integrationGrep(origin) }
      : profiles[scope];

  if (!profile) throw new Error(`Unbekanntes Browserprofil: ${scope}`);

  return profile;
}

export function browserServers(scope: string) {
  return {
    offline: scope === 'all' || scope === 'integration-full',
    dev: !['landing-only', 'landing-full'].includes(scope),
  };
}

export interface BrowserJob {
  area: string;
  label: string;
  scope: string;
  origin: string;
  shard: number;
  total: number;
  report: string;
}

// eslint-disable-next-line max-lines-per-function -- Ein deklarativer Matrixeintrag enthält alle zusammengehörigen Ausführungs- und Reportfelder.
function shards(
  area: string,
  label: string,
  scope: string,
  origin: string,
  total = 1,
): BrowserJob[] {
  return Array.from({ length: total }, (_, i) => ({
    area,
    label,
    scope,
    origin,
    shard: i + 1,
    total,
    report: `${area}-${i + 1}`,
  }));
}

const shortAreas: Record<string, string[]> = {
  none: [],
  landing: ['landing'],
  play: ['play'],
  both: ['landing', 'play'],
  smoke: ['landing', 'play'],
  integration: [],
};
const labels: Record<string, string> = {
  landing: 'Landingpage',
  play: 'Spiel',
  integration: 'Integration',
};

export function browserJobs(scope: QaScope, event: string) {
  if (scope === 'none') return [];

  if (scope === 'all') return fullJobs(event);
  const areas = [...shortAreas[scope], 'integration'];

  return areas.flatMap((area) =>
    shards(area, labels[area], area === 'integration' ? 'integration' : `${area}-only`, scope),
  );
}

function fullJobs(event: string) {
  if (event !== 'pull_request') return shards('all', 'Vollprüfung', 'all', 'all', 4);

  return ['landing', 'play', 'integration'].flatMap((area) =>
    shards(area, labels[area], `${area}-full`, 'all', area === 'play' ? 4 : 1),
  );
}
