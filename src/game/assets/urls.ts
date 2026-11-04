import pixelSheetUrl from '../../../assets/pixel/pixel-sheet.png?url';

/** Vite rewrites imported asset URLs for the configured production base. */
export function spriteUrl(key: 'pixel') {
  switch (key) { case 'pixel': return pixelSheetUrl; }
}
