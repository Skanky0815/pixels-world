import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UpdateConsent } from '../../src/pwa/update-consent.ts';

// eslint-disable-next-line max-lines-per-function -- Zwei Tabs müssen unabhängig zustimmen, auch wenn ein anderer das Update aktiviert.
test('Ein anderer Tab darf eine laufende Runde nicht neu laden', async () => {
  let reloads = 0;
  let activations = 0;
  const consent = new UpdateConsent(() => reloads++);

  consent.controllerChanged();
  assert.equal(reloads, 0);
  await consent.confirm(async () => {
    activations++;
  });
  assert.equal(activations, 0);
  assert.equal(reloads, 1);
  consent.controllerChanged();
  assert.equal(reloads, 1);
});

// eslint-disable-next-line max-lines-per-function -- Nur eine bestätigte Aktivierung darf nach dem tatsächlichen Controllerwechsel genau einmal laden.
test('Bestätigung wartet auf Aktivierung und verhindert doppelte Neustarts', async () => {
  let reloads = 0;
  let activations = 0;
  const consent = new UpdateConsent(() => reloads++);
  const activate = async () => {
    activations++;
  };

  await Promise.all([consent.confirm(activate), consent.confirm(activate)]);
  assert.equal(activations, 1);
  assert.equal(reloads, 0);
  consent.controllerChanged();
  consent.controllerChanged();
  assert.equal(reloads, 1);
});

// eslint-disable-next-line max-lines-per-function -- Fehlgeschlagene Aktivierung muss die Freigabe widerrufen und einen bewussten neuen Versuch erlauben.
test('Fehlgeschlagene Aktivierung hinterlässt keine automatische Neustartfreigabe', async () => {
  let reloads = 0;
  const consent = new UpdateConsent(() => reloads++);

  await assert.rejects(
    consent.confirm(async () => {
      throw new Error('offline');
    }),
  );
  consent.controllerChanged();
  assert.equal(reloads, 0);
  await consent.confirm(async () => undefined);
  assert.equal(reloads, 1);
});
