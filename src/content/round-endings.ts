import type { ReconciliationLevel } from './reconciliation.ts';

/** Final remarks combine the original anger level with the reconciliation outcome. */
export const ROUND_ENDINGS: Record<
  ReconciliationLevel,
  { readonly success: string; readonly failed: string }
> = {
  calm: {
    success: 'Na gut, du darfst bleiben. War ohnehin dein Plan, oder?',
    failed: 'Heute gibt es Streicheln erst nach einer kleinen Denkpause.',
  },
  annoyed: {
    success: 'Dir ist verziehen. Dem Sofa noch nicht.',
    failed: 'Der Blick ist süß. Die Kratzer bleiben trotzdem.',
  },
  angry: {
    success: 'Ich hab dich lieb. Über die Einrichtung reden wir morgen.',
    failed: 'Nein, Pixel. Das war heute selbst für dein Schnurren zu viel.',
  },
};
