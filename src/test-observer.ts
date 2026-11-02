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
        curtain: Object.freeze({ ...state.curtain, lastDamage: state.curtain.lastDamage ? Object.freeze(state.curtain.lastDamage) : null }),
        couch: Object.freeze({ ...state.couch, lastDamage: state.couch.lastDamage ? Object.freeze(state.couch.lastDamage) : null }),
        vases: Object.freeze(state.vases.map(vase => Object.freeze(vase))),
      });
    },
  });
  return () => { Reflect.deleteProperty(window, '__pixelTest'); };
}
