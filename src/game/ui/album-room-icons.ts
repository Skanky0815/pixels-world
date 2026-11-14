import type { AlbumRoom } from '../../content/album/discovery';

/** Small navigation symbols, not previews of undiscovered album entries. */
const ICONS: Readonly<Record<AlbumRoom | 'achievements', string>> = {
  'living-room': '<path d="M6 10V6h12v4M5 11H3v8h18v-8h-2M6 10v5h12v-5M5 19v2m14-2v2"/>',
  kitchen:
    '<path d="M5 3v6m3-6v6M3 3v5c0 4 7 4 7 0V3M6.5 11v10M18 3c-5 4-5 10 0 10h2V3h-2Zm2 10v8"/>',
  bedroom: '<path d="M3 5v16m18-10v10M3 17h18M3 10h18v7M7 7h5v3H7z"/>',
  achievements:
    '<path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-4 1h8"/>',
  study: '<path d="M3 4h5c2 0 4 1 4 3 0-2 2-3 4-3h5v15h-5c-2 0-4 1-4 2-1-1-2-2-4-2H3V4Zm9 3v14"/>',
};

export function roomIcon(room: AlbumRoom | 'achievements') {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">${ICONS[room]}</svg>`;
}
