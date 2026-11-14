import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import { copy } from '../../i18n/locale.ts';
export const KITCHEN = {
  ...KITCHEN_PREVIEW,
  id: 'kitchen',
  caption: copy('kitchenTitle'),
} as const;
