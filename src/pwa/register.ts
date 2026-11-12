import { registerSW } from 'virtual:pwa-register';
import { checkRegistration } from './check-registration';
import { gameUpdates, type UpdatePort } from './updates';
let registered = false;

type RegistrationPort = Pick<UpdatePort, 'check' | 'activate'>;

/** Detect releases without granting any tab permission to restart itself. */
// eslint-disable-next-line max-lines-per-function -- Registrierung und Browser-Rückkehr teilen die einmalige Seitenlebensdauer.
export function registerOfflineGame() {
  if (registered || !('serviceWorker' in navigator)) return;
  registered = true;
  const registration = retryableRegistration();

  gameUpdates.connect({
    check: async () => (await registration()).check(),
    activate: async () => (await registration()).activate(),
    online: () => navigator.onLine,
  });
  void gameUpdates.check();
  listenForReturn();
}

function retryableRegistration() {
  let pending: Promise<RegistrationPort> | undefined;

  return () =>
    (pending ??= createRegistration().catch((error) => {
      pending = undefined;
      throw error;
    }));
}

// eslint-disable-next-line max-lines-per-function -- Registrierung und zugehörige Plugin-Callbacks bilden einen gemeinsamen, wiederholbaren Versuch.
function createRegistration(): Promise<RegistrationPort> {
  // eslint-disable-next-line max-lines-per-function -- Die Plugin-Callbacks lösen genau einen Registrierungsversuch samt Aktivierungsfunktion auf.
  return new Promise((resolve, reject) => {
    const activate = registerSW({
      immediate: true,
      onNeedRefresh: () => gameUpdates.ready(),
      onNeedReload: () => gameUpdates.activated(),
      onRegisterError: reject,
      onRegisteredSW: (url, registration) => {
        if (!registration) return reject(new Error('Service worker registration unavailable'));
        observeInstallation(registration);
        resolve({ check: () => checkRegistration(url, registration), activate: () => activate() });
      },
    });
  });
}

// eslint-disable-next-line max-lines-per-function -- Einmalige Seitenereignisse benötigen dieselbe begrenzte Prüfung und dieselbe Neustartgrenze.
function listenForReturn() {
  let controlled = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) gameUpdates.activated();
    controlled = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void gameUpdates.check();
  });
  window.addEventListener('focus', () => {
    void gameUpdates.check();
  });
  window.addEventListener('online', () => {
    void gameUpdates.check(true);
  });
  setInterval(
    () => {
      if (!document.hidden) void gameUpdates.check();
    },
    60 * 60 * 1000,
  );
}

/** An initially uncontrolled first visit can also see an update activate without waiting. */
function observeInstallation(registration: ServiceWorkerRegistration) {
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;

    if (worker && registration.active) observeUpdate(worker);
  });
}

function observeUpdate(worker: ServiceWorker) {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') gameUpdates.ready();

    if (worker.state === 'activated' && !navigator.serviceWorker.controller)
      gameUpdates.activated();
  });
}
