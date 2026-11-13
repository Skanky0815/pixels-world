/** Touch only this application's exact scope and Workbox caches. */
// eslint-disable-next-line max-lines-per-function -- Registrierung und zugehöriger Cache werden ausschließlich für denselben App-Scope entfernt.
export async function removeOfflineGame() {
  if (!('serviceWorker' in navigator)) return;
  const scope = new URL(import.meta.env.BASE_URL, location.href).href;
  const registration = await navigator.serviceWorker.getRegistration(scope);

  if (registration?.scope === scope) await registration.unregister();

  if (!('caches' in window)) return;
  const names = await caches.keys();

  await Promise.all(
    names
      .filter((name) => name.startsWith('workbox-') && name.endsWith(scope))
      .map((name) => caches.delete(name)),
  );
}

export async function checkOnlineVersion() {
  const url = new URL('version.json', new URL(import.meta.env.BASE_URL, location.href));
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });

  if (!response.ok) throw new Error('Version check failed');
  const data = await response.json();

  if (typeof data.version !== 'string' || !data.version) throw new Error('Invalid version');

  return data.version !== __APP_VERSION__;
}
