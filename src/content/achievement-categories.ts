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
/** New categories extend the current collection; v1 categories retain their exact original targets. */
export const ACHIEVEMENT_CATEGORIES_V2 = [
  {
    id: 'food-bags',
    name: { de: 'Alle Futterbeutel', en: 'All food bags' },
    targets: ['food-bag.dry'],
  },
  {
    id: 'dishes',
    name: { de: 'Das ganze Geschirr', en: 'All the crockery' },
    targets: ['dish.cup', 'dish.plate'],
  },
] as const;
/** The expanded plant objective is a new version; the cat-grass-only objective stays frozen. */
export const ACHIEVEMENT_CATEGORIES_V3 = [
  {
    id: 'plants',
    name: { de: 'Alle Pflanzen II', en: 'All plants II' },
    targets: ['plant.catgrass', 'plant.basil', 'plant.parsley', 'plant.mint'],
  },
] as const;
/** Pantry objectives extend the collection without changing earlier category targets. */
export const ACHIEVEMENT_CATEGORIES_V4 = [
  {
    id: 'pantry',
    name: { de: 'Alle Vorratsbehälter', en: 'All pantry containers' },
    targets: ['pantry.jar', 'pantry.tin'],
  },
] as const;
/** Rubbish bins receive a new category; existing categories stay frozen. */
export const ACHIEVEMENT_CATEGORIES_V5 = [
  {
    id: 'trash-bins',
    name: { de: 'Alles ausgeleert', en: 'Everything emptied' },
    targets: ['trash-bin.cream'],
  },
] as const;
/** The pulled cloth extends the collection without changing released objectives. */
export const ACHIEVEMENT_CATEGORIES_V6 = [
  {
    id: 'tablecloths',
    name: { de: 'Tisch frei!', en: 'Table cleared!' },
    targets: ['tablecloth.warm'],
  },
] as const;
export const DESTRUCTION_VARIANTS: readonly string[] = Object.freeze([
  ...new Set(
    [
      ...ACHIEVEMENT_CATEGORIES,
      ...ACHIEVEMENT_CATEGORIES_V2,
      ...ACHIEVEMENT_CATEGORIES_V3,
      ...ACHIEVEMENT_CATEGORIES_V4,
      ...ACHIEVEMENT_CATEGORIES_V5,
      ...ACHIEVEMENT_CATEGORIES_V6,
    ].flatMap((category) => [...category.targets]),
  ),
]);
export const SHELF_TARGET_NAMES: Readonly<
  Record<string, { readonly de: string; readonly en: string }>
> = {
  'shelf.fragile': { de: 'Fragiles Regal', en: 'Fragile shelf' },
  'shelf.normal': { de: 'Normales Regal', en: 'Normal shelf' },
};
