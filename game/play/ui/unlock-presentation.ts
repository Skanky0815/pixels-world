import { ACHIEVEMENTS, type AchievementDefinition } from '../content/achievements.ts';
import { INTERACTABLE_ALBUM } from '../content/album/index.ts';
import type { AlbumEntry } from '../content/album/discovery.ts';
import { ALBUM_ART } from './album-art.ts';

const ACHIEVEMENT_ART = {
  love: new URL('../../../assets/community/slack-v1/pixel_love.png', import.meta.url).href,
  chaos: new URL('../../../assets/community/slack-v1/pixel_chaos.png', import.meta.url).href,
} as const;

export interface UnlockPresentation {
  readonly id: string;
  readonly name: AlbumEntry['name'];
  readonly image: string;
  readonly kind: 'album' | 'achievement';
}

function present(
  entry: Pick<AlbumEntry, 'id' | 'name'>,
  kind: UnlockPresentation['kind'],
  image: string | undefined,
): UnlockPresentation | null {
  return typeof image === 'string' && image.length > 0
    ? Object.freeze({ id: entry.id, name: entry.name, image, kind })
    : null;
}

export function albumPresentation(entry: AlbumEntry) {
  return present(entry, 'album', ALBUM_ART[entry.asset]);
}

export function achievementPresentation(entry: AchievementDefinition) {
  return present(entry, 'achievement', ACHIEVEMENT_ART[entry.art]);
}

const PRESENTATIONS = new Map(
  [
    ...Object.values(INTERACTABLE_ALBUM).map(albumPresentation),
    ...ACHIEVEMENTS.map(achievementPresentation),
  ].flatMap((entry) => (entry ? [[entry.id, entry] as const] : [])),
);

/** Display metadata only; confirmed IDs and presentation timing belong to the round/queue. */
export function unlockPresentation(id: string | null): UnlockPresentation | null {
  return id === null ? null : (PRESENTATIONS.get(id) ?? null);
}
