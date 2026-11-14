import { currentLanguage, t } from '../../i18n/locale';
import type { AlbumEntry } from '../../content/album/discovery';
import { ALBUM_ART } from './album-art';
import { roomIcon } from './album-room-icons';
export const ALBUM_CHAPTERS = [
  'living-room',
  'kitchen',
  'bedroom',
  'study',
  'achievements',
] as const;
export type AlbumChapter = (typeof ALBUM_CHAPTERS)[number];
export const ALBUM_ROOMS = ['living-room', 'kitchen', 'bedroom', 'study'] as const;
const ROOM_KEYS = {
  'living-room': 'albumLivingRoom',
  kitchen: 'albumKitchen',
  bedroom: 'albumBedroom',
  study: 'albumStudy',
} as const;

export function roomName(room: AlbumChapter) {
  return room === 'achievements' ? t('albumAchievements') : t(ROOM_KEYS[room]);
}

export function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export function entryImage(entry: AlbumEntry) {
  return `<img src="${escape(ALBUM_ART[entry.asset])}" alt="${escape(entry.name[currentLanguage()])}" draggable="false">`;
}

export function albumTabs(room: AlbumChapter, entries: readonly AlbumEntry[], overview = false) {
  const marker = (id: AlbumChapter) => {
    const exists = id === 'achievements' || entries.some((entry) => entry.rooms.includes(id));
    const label = `${roomName(id)}${exists ? '' : ` ${t('albumSoon')}`}`;

    return `<button type="button" class="album-bookmark" role="tab" id="album-tab-${id}" aria-controls="album-room" aria-selected="${id === room}" aria-label="${escape(label)}" title="${escape(label)}" data-room="${id}" data-focus="room-${id}">${roomIcon(id)}${id === 'achievements' ? `<span>${overview && id === room ? '← ' : ''}${t('albumAchievements')}</span>` : ''}</button>`;
  };

  return `<nav class="album-tabs" role="tablist" aria-label="${t('albumRooms')}"><div class="album-tabs-coming">${ALBUM_CHAPTERS.map(marker).join('')}</div></nav>`;
}

export const ALBUM_PAGE_SIZE = 9;
export function albumPagination(page: number, pages: number) {
  return `<nav class="album-pagination" aria-label="${t('albumPages')}"><button type="button" class="ui-button ui-button--icon" data-action="page-previous" data-focus="page-previous" aria-label="${t('albumPreviousPage')}" title="${t('albumPreviousPage')}" ${page === 0 ? 'disabled' : ''}><span aria-hidden="true">‹</span></button><span role="status">${t('albumPageCount', { page: page + 1, pages })}</span><button type="button" class="ui-button ui-button--icon" data-action="page-next" data-focus="page-next" aria-label="${t('albumNextPage')}" title="${t('albumNextPage')}" ${page + 1 === pages ? 'disabled' : ''}><span aria-hidden="true">›</span></button></nav>`;
}

export function albumPage(entry: AlbumEntry | undefined) {
  const back = `<button type="button" class="album-overview ui-button" data-action="overview" data-focus="overview">${t('albumOverview')}</button>`;

  if (!entry)
    return `<section class="album-story">${back}<span class="album-eyebrow">${t('albumChoose')}</span><div class="album-mystery" aria-hidden="true">?</div><h3>${t('albumSecret')}</h3><p>${t('albumHint')}</p></section>`;
  const lang = currentLanguage();

  return `<section class="album-story" aria-label="${escape(entry.name[lang])}">${back}<span class="album-eyebrow">${t('albumDiscovered')}</span><figure>${entryImage(entry)}<figcaption>${escape(entry.name[lang])}</figcaption></figure><div class="album-story-copy"><p>${escape(entry.fluff[lang])}</p><blockquote>${escape(entry.sara[lang])}<cite>— Sara</cite></blockquote></div></section>`;
}

export function albumTile(
  entry: AlbumEntry,
  index: number,
  found: ReadonlySet<string>,
  selected?: string,
) {
  if (!found.has(entry.id))
    return `<button type="button" class="album-tile" disabled aria-label="${t('albumUnknown', { number: index + 1 })}"><span aria-hidden="true">?</span></button>`;

  return `<button type="button" class="album-tile" data-entry="${index}" data-focus="entry-${index}" aria-pressed="${entry.id === selected}" aria-label="${escape(entry.name[currentLanguage()])}">${entryImage(entry)}</button>`;
}
