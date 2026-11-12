/* eslint-disable max-lines-per-function -- Asynchrone Update-Rennen werden mit kontrollierten Browser-Ports als vollständige Szenarien geprüft. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameUpdates } from '../../src/pwa/updates.ts';

const port = () => ({
  check: async () => false,
  activate: async () => undefined,
  online: () => true,
});

test('Fokuswechsel teilen eine Prüfung; manuelle Suche umgeht nur das Zeitlimit', async () => {
  let checks = 0;
  let finish: (ready: boolean) => void = () => {};

  const updates = new GameUpdates(() => assert.fail('Kein ungefragter Neustart'));

  updates.connect({
    ...port(),
    check: () => {
      checks++;

      return new Promise((r) => {
        finish = r;
      });
    },
  });
  const first = updates.check(false, 100);

  assert.equal(updates.check(true, 101), first);
  assert.equal(checks, 1);
  finish(false);
  await first;
  await updates.check(false, 200);
  assert.equal(checks, 1);
  const manual = updates.check(true, 200);

  assert.equal(checks, 2);
  finish(false);
  await manual;
});

test('Offline prüft nicht; nach Rückkehr ist ein erneuter Versuch möglich', async () => {
  let online = false;
  let checks = 0;
  const updates = new GameUpdates(() => assert.fail('Kein Neustart'));

  updates.connect({
    ...port(),
    online: () => online,
    check: async () => {
      checks++;

      return false;
    },
  });
  await updates.check(true);
  assert.equal(updates.snapshot().status, 'offline');
  assert.equal(checks, 0);
  online = true;
  await updates.check(true);
  assert.equal(updates.snapshot().status, 'current');
});

test('Ein spätes Prüfergebnis überschreibt kein bereits fertig installiertes Update', async () => {
  let finish: (ready: boolean) => void = () => {};

  const updates = new GameUpdates(() => assert.fail('Kein ungefragter Neustart'));

  updates.connect({
    ...port(),
    check: () =>
      new Promise((r) => {
        finish = r;
      }),
  });
  const check = updates.check(true);

  updates.ready();
  finish(false);
  await check;
  assert.deepEqual(updates.snapshot(), { status: 'ready', available: true });
});

test('Fremde Aktivierung lädt erst nach eigener Bestätigung und dann nur einmal', async () => {
  let reloads = 0;
  const updates = new GameUpdates(() => reloads++);

  updates.connect({ ...port(), activate: async () => assert.fail('Schon aktiviert') });
  updates.activated();
  await updates.check(true);
  assert.equal(reloads, 0);
  await updates.apply();
  updates.activated();
  assert.equal(reloads, 1);
});

test('Fehlgeschlagene Suche und Aktivierung bleiben erneut bedienbar', async () => {
  let failing = true;
  const updates = new GameUpdates(() => assert.fail('Ohne Controllerwechsel kein Neustart'));
  const operation = async () => {
    if (failing) throw new Error('server unavailable');
  };

  updates.connect({
    ...port(),
    check: async () => {
      await operation();

      return true;
    },
    activate: operation,
  });
  await updates.check(true);
  assert.equal(updates.snapshot().status, 'error');
  failing = false;
  await updates.check(true);
  assert.equal(updates.snapshot().status, 'ready');
  failing = true;
  await updates.apply();
  assert.equal(updates.snapshot().status, 'error');
  failing = false;
  await updates.apply();
  assert.equal(updates.snapshot().status, 'applying');
});
