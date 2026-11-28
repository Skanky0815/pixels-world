import type { buildObjects } from './build-objects';

// eslint-disable-next-line max-lines-per-function -- Alle realen Adapter liefern zusammen einen losgelösten, typisierten Objektbefund.
export function observeObjects(built: ReturnType<typeof buildObjects>) {
  return {
    curtains: built.curtains.map((curtain) => curtain.snapshot()),
    lamps: built.lamps.map((lamp) => lamp.snapshot()),
    carpets: built.carpets.map((carpet) => carpet.snapshot()),
    pictures: built.pictures.map((picture) => picture.snapshot()),
    books: built.books.map((books) => books.snapshot()),
    laundry: built.laundry.map((laundry) => laundry.snapshot()),
    tablecloths: built.tablecloths.map((cloth) => cloth.snapshot()),
    trashBins: built.trashBins.map((bin) => bin.snapshot()),
    foodBags: built.foodBags.map((bag) => bag.snapshot()),
    pantry: built.pantry.map((item) => item.snapshot()),
    plants: built.plants.map((plant) => plant.supportedSnapshot()),
    dishes: built.dishes.map((dish) => dish.snapshot()),
    objects: built.entries.map((entry) => ({
      id: entry.object.id,
      kind: entry.definition.kind,
      variant: entry.definition.variant,
      ...entry.object.damageSnapshot(),
    })),
    objectImpacts: built.impacts.snapshot(),
    vases: built.vases.map((vase) => vase.snapshot()),
    couch: built.couches[0]?.snapshot() ?? null,
    curtain: built.curtains[0]?.snapshot() ?? null,
    plant: built.plants[0]?.snapshot() ?? null,
  };
}
