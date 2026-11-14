/** Frozen released variants: later content must not revoke an earned category. */
export const ACHIEVEMENT_CATEGORIES = [
  {
    id: 'vases',
    name: { de: 'Alle Vasen', en: 'All vases' },
    targets: ['vase.terracotta', 'vase.blue', 'vase.gold', 'vase.mellow'],
  },
  {
    id: 'books',
    name: { de: 'Alle Bücher', en: 'All books' },
    targets: ['books.stacked', 'books.upright'],
  },
  {
    id: 'pictures',
    name: { de: 'Alle Bilder', en: 'All pictures' },
    targets: ['picture.pixel', 'picture.berlin', 'picture.cozy'],
  },
  { id: 'couches', name: { de: 'Alle Sofas', en: 'All couches' }, targets: ['couch.cozy'] },
  { id: 'curtains', name: { de: 'Alle Vorhänge', en: 'All curtains' }, targets: ['curtain.warm'] },
  { id: 'plants', name: { de: 'Alle Pflanzen', en: 'All plants' }, targets: ['plant.catgrass'] },
  {
    id: 'shelves',
    name: { de: 'Alle zerstörbaren Regale', en: 'All breakable shelves' },
    targets: ['shelf.fragile', 'shelf.normal'],
  },
] as const;
export const DESTRUCTION_VARIANTS: readonly string[] = Object.freeze(
  ACHIEVEMENT_CATEGORIES.flatMap((category) => [...category.targets]),
);
export const SHELF_TARGET_NAMES: Readonly<
  Record<string, { readonly de: string; readonly en: string }>
> = {
  'shelf.fragile': { de: 'Fragiles Regal', en: 'Fragile shelf' },
  'shelf.normal': { de: 'Normales Regal', en: 'Normal shelf' },
};
