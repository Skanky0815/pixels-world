/** Wait for the entire precache installation, not merely the update request. */
// eslint-disable-next-line max-lines-per-function -- Netzwerkprüfung und vollständig abgeschlossene Installation bilden eine atomare Bereitschaftsgrenze.
export async function checkRegistration(url: string, registration: ServiceWorkerRegistration) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: { 'Cache-Control': 'no-cache' },
  });

  if (!response.ok) throw new Error('Update check failed');
  await registration.update();
  await installed(registration.installing);

  return !!registration.waiting;
}

// eslint-disable-next-line max-lines-per-function -- Der begrenzte Browser-Lebenszyklus räumt Listener und Zeitlimit bei jedem Ausgang auf.
function installed(worker: ServiceWorker | null): Promise<void> {
  if (!worker || worker.state === 'installed' || worker.state === 'activated')
    return Promise.resolve();

  // eslint-disable-next-line max-lines-per-function -- Einmaliger Listener mit Timer benötigt denselben Abschluss für Erfolg, Fehler und Zeitüberschreitung.
  return new Promise((resolve, reject) => {
    const changed = () => {
      if (worker.state === 'redundant') finish(new Error('Update installation failed'));
      else if (worker.state === 'installed' || worker.state === 'activated') finish();
    };

    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener('statechange', changed);

      if (error) reject(error);
      else resolve();
    };

    const timer = setTimeout(() => finish(new Error('Update installation timed out')), 60_000);

    worker.addEventListener('statechange', changed);
    changed();
  });
}
