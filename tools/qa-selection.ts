import { specArea, type QaScope } from './qa-profiles.ts';

const documentation = /^(?:docs\/|.*\.md$)|^(?:LICENSE|LICENSE\..*|\.gitignore)$/;
const sourceArt = /(?:^|\/)reference-[^/]+\/|-(?:source|preview)[^/]*\.png$|^assets\/banner\./;

const pathAreas: [RegExp, QaScope][] = [
  [/^game\/landingpage\//, 'landing'],
  [/^game\/play\//, 'play'],
  [/^game\/shared\/(?:pwa\/|settings\/storage)/, 'all'],
  [/^game\/shared\//, 'both'],
  [/^(?:assets\/(?:landing|community)\/|public\/downloads\/)/, 'landing'],
  [/^assets\/(?:pixel|team)\//, 'both'],
  [/^assets\/(?:objects|environment|audio|ui|sara|dialogue-portraits)\//, 'play'],
];

export function classifyPath(path: string): QaScope {
  if (path.startsWith('tests/')) return testArea(path);

  if (documentation.test(path) || (path.startsWith('assets/') && sourceArt.test(path)))
    return 'none';

  return pathAreas.find(([pattern]) => pattern.test(path))?.[1] ?? 'all';
}

function testArea(path: string): QaScope {
  const name = /^tests\/e2e\/([^/]+)\.spec\.ts(?:$|-snapshots\/)/.exec(path)?.[1];

  const area = name ? specArea(name) : 'all';

  // Changed gameplay specs must run beyond their optional smoke-tagged subset.
  return area === 'play' ? 'all' : area;
}

function combinedScope(paths: string[]): QaScope {
  const areas = new Set(paths.map(classifyPath).filter((area) => area !== 'none'));

  if (areas.has('all')) return 'all';

  if (areas.has('both') || areas.size > 1) return 'both';

  return areas.values().next().value ?? 'none';
}

export interface SelectionInput {
  event: string;
  fullRound?: boolean;
  requested?: string;
  paths?: string[];
}

/** Undefined paths mean incomplete/failed detection, so use the full suite. */
export function selectQa({ event, fullRound, requested, paths }: SelectionInput) {
  if (fullRound || event === 'workflow_call') return plan('all');

  if (event === 'workflow_dispatch') return plan(manualScope(requested));
  const area = paths?.length ? combinedScope(paths) : 'all';

  if (event === 'push') return plan('none', area !== 'none');

  if (event === 'pull_request') return plan(area);

  return plan('all');
}

function manualScope(requested = 'all'): QaScope {
  if (['all', 'smoke', 'landing', 'play', 'both'].includes(requested)) return requested as QaScope;

  throw new Error(`Ungültiger manueller QA-Umfang: ${requested}`);
}

function plan(scope: QaScope, quality = scope !== 'none') {
  const total = scope === 'all' ? 4 : 1;

  return { scope, quality, shards: Array.from({ length: total }, (_, i) => i + 1), total };
}
