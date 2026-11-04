import type { GameTestState } from './test-state';

/** Imported only in Vite's e2e mode. Each read returns a detached frozen snapshot. */
export function installTestObserver(read: () => GameTestState) {
  Object.defineProperty(window, '__pixelTest', {
    configurable: true,
    get() {
      const state = read();
      return Object.freeze({
        ...state,
        room: Object.freeze(state.room),
        camera: Object.freeze(state.camera),
        pixel: Object.freeze(state.pixel),
        chaos: Object.freeze(state.chaos),
        hud: Object.freeze(state.hud),
        curtain: state.curtain ? Object.freeze({ ...state.curtain, lastDamage: state.curtain.lastDamage ? Object.freeze(state.curtain.lastDamage) : null }) : null,
        couch: state.couch ? Object.freeze({ ...state.couch, lastDamage: state.couch.lastDamage ? Object.freeze(state.couch.lastDamage) : null }) : null,
        plant: state.plant ? Object.freeze({ ...state.plant, lastDamage: state.plant.lastDamage ? Object.freeze(state.plant.lastDamage) : null }) : null,
        objects: Object.freeze(state.objects.map(object => Object.freeze({ ...object, lastDamage: object.lastDamage ? Object.freeze(object.lastDamage) : null }))),
        vases: Object.freeze(state.vases.map(vase => Object.freeze(vase))),
      });
    },
  });
  return () => { Reflect.deleteProperty(window, '__pixelTest'); };
}
