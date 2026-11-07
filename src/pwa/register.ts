import { registerSW } from 'virtual:pwa-register';

/** Waiting updates activate after old tabs close; never reload an active round. */
export function registerOfflineGame() {
  registerSW({ immediate: true });
}
