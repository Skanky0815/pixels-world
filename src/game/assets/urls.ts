import pixelSheetUrl from '../../../assets/pixel/pixel-sheet.png?url';
import saraSheetUrl from '../../../assets/sara/sara-sheet-v1.png?url';

/** Vite rewrites imported asset URLs for the configured production base. */
export function spriteUrl(key: 'pixel' | 'sara') {
  switch (key) {
    case 'pixel': return pixelSheetUrl;
    case 'sara': return saraSheetUrl;
  }
}
