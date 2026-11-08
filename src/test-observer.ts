import type { GameTestState } from './test-state';

/** Imported only in Vite's e2e mode. Each read returns a detached frozen snapshot. */
// eslint-disable-next-line max-lines-per-function -- Der unveränderliche Beobachter veröffentlicht einen vollständigen defensiv kopierten Vertrag ohne Mutatoren.
export function installTestObserver(read: () => GameTestState) {
  Object.defineProperty(window, '__pixelTest', {
    configurable: true,

    // eslint-disable-next-line max-lines-per-function, complexity -- Optionale Schadens- und Albumereignisse werden defensiv eingefroren, ohne einen Zustandsschreiber zu exponieren.
    get() {
      const state = read();

      return Object.freeze({
        ...state,
        round: Object.freeze(state.round),
        goal: Object.freeze(state.goal),
        goalView: Object.freeze(state.goalView),
        intro: Object.freeze(state.intro),
        reconciliation: Object.freeze(state.reconciliation),
        charmDisplay: Object.freeze(state.charmDisplay),
        result: state.result ? Object.freeze(state.result) : null,
        homecoming: Object.freeze(state.homecoming),
        pixelReturn: Object.freeze(state.pixelReturn),
        sara: Object.freeze(state.sara),
        room: Object.freeze(state.room),
        camera: Object.freeze(state.camera),
        pixel: Object.freeze(state.pixel),
        chaos: Object.freeze(state.chaos),
        hud: Object.freeze(state.hud),
        curtain: state.curtain
          ? Object.freeze({
              ...state.curtain,
              lastDamage: state.curtain.lastDamage ? Object.freeze(state.curtain.lastDamage) : null,
            })
          : null,
        couch: state.couch
          ? Object.freeze({
              ...state.couch,
              lastDamage: state.couch.lastDamage ? Object.freeze(state.couch.lastDamage) : null,
            })
          : null,
        plant: state.plant
          ? Object.freeze({
              ...state.plant,
              lastDamage: state.plant.lastDamage ? Object.freeze(state.plant.lastDamage) : null,
            })
          : null,
        pictures: Object.freeze(
          state.pictures.map((p) =>
            Object.freeze({ ...p, lastDamage: p.lastDamage ? Object.freeze(p.lastDamage) : null }),
          ),
        ),
        pictureDiscovery: state.pictureDiscovery
          ? Object.freeze({ ...state.pictureDiscovery })
          : null,
        wallPlacements: Object.freeze(
          state.wallPlacements.map((p) =>
            Object.freeze({ ...p, bounds: Object.freeze({ ...p.bounds }) }),
          ),
        ),
        shelves: Object.freeze(
          state.shelves.map((shelf) =>
            Object.freeze({
              ...shelf,
              lastDamage: shelf.lastDamage ? Object.freeze(shelf.lastDamage) : null,
            }),
          ),
        ),
        objects: Object.freeze(
          state.objects.map((object) =>
            Object.freeze({
              ...object,
              lastDamage: object.lastDamage ? Object.freeze(object.lastDamage) : null,
            }),
          ),
        ),
        vases: Object.freeze(state.vases.map((vase) => Object.freeze(vase))),
      });
    },
  });

  return () => {
    Reflect.deleteProperty(window, '__pixelTest');
  };
}
