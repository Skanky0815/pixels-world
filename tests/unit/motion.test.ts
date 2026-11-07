import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MotionPreferences, MOTION_STORAGE_KEY } from '../../src/settings/motion.ts';

// eslint-disable-next-line max-lines-per-function -- Gespeicherter Wunsch und wechselnde Systemeinstellung müssen unabhängig kombiniert werden.
test('Reduzierte Bewegung respektiert das System und die gespeicherte Auswahl', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const media = Object.assign(new EventTarget(), { matches: true });
  const preferences = new MotionPreferences(storage, media);

  assert.deepEqual(preferences.snapshot(), { reduced: true, system: true });
  preferences.setReduced(false);
  assert.equal(preferences.snapshot().reduced, true);
  media.matches = false;
  media.dispatchEvent(new Event('change'));
  assert.equal(preferences.snapshot().reduced, false);
  preferences.setReduced(true);
  assert.equal(values.get(MOTION_STORAGE_KEY), 'true');
  assert.equal(new MotionPreferences(storage).snapshot().reduced, true);
  preferences.destroy();
});

// eslint-disable-next-line max-lines-per-function -- Speicherfehler und Abmeldung dürfen weder den aktuellen Wunsch blockieren noch alte Ansichten benachrichtigen.
test('Bewegungswunsch bleibt ohne Speicher nutzbar und Listener werden entfernt', () => {
  const preferences = new MotionPreferences({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  let changes = 0;
  const unsubscribe = preferences.subscribe(() => {
    changes++;
  });

  preferences.setReduced(true);
  assert.equal(preferences.snapshot().reduced, true);
  unsubscribe();
  preferences.setReduced(false);
  assert.equal(changes, 1);
  preferences.destroy();
});
