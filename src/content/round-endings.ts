import { copy } from '../i18n/locale.ts';
import type { ReconciliationLevel } from './reconciliation.ts';
/** Final remarks combine the original anger level with the reconciliation outcome. */
export const ROUND_ENDINGS: Record<
  ReconciliationLevel,
  {
    readonly success: string;
    readonly failed: string;
  }
> = {
  calm: {
    success: copy('fineYouCanStayThatWas'),
    failed: copy('cuddlesCanWaitUntilWeVe'),
  },
  annoyed: {
    success: copy('youReForgivenTheSofaIsn'),
    failed: copy('cuteFaceStillDoesnTUn'),
  },
  angry: {
    success: copy('iLoveYouWeLlDiscuss'),
    failed: copy('noPixelEvenYourPurringHas'),
  },
};
