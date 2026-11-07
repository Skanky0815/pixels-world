import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { PlayActivity } from '../../src/game/input/play-activity.ts';

const browserWindow = new EventTarget();
const browserDocument = Object.assign(new EventTarget(), { hidden: false, hasFocus: () => true });
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow });
Object.defineProperty(globalThis, 'document', { configurable: true, value: browserDocument });

after(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
  else Reflect.deleteProperty(globalThis, 'window');

  if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});

// eslint-disable-next-line max-lines-per-function -- Fokusereignis, Resume-Delta und begrenzter Normalbetrieb prüfen gemeinsam den Zeitvertrag.
test('Erstes und erstes wiederaufgenommenes Delta verwerfen Hintergrundzeit', () => {
  const activity = new PlayActivity(() => {});

  assert.equal(activity.delta(50000), 0);
  assert.equal(activity.delta(16), 16);
  browserWindow.dispatchEvent(new Event('blur'));
  assert.equal(activity.active, false);
  assert.equal(activity.delta(50000), 0);
  browserWindow.dispatchEvent(new Event('focus'));
  assert.equal(activity.active, true);
  assert.equal(activity.delta(50000), 0);
  assert.equal(activity.delta(50000), 100);
  assert.equal(activity.delta(NaN), 0);
  assert.equal(activity.delta(-1), 0);
  activity.destroy();
});

// eslint-disable-next-line max-lines-per-function -- Verstecken, erneuter Fokus und Anzeigen müssen denselben unabhängigen Visibility-Vertrag respektieren.
test('Versteckter Tab bleibt auch bei Fokusereignissen inaktiv', () => {
  const activity = new PlayActivity(() => {});

  browserDocument.hidden = true;
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  browserWindow.dispatchEvent(new Event('focus'));
  assert.equal(activity.active, false);
  assert.equal(activity.delta(50000), 0);
  browserDocument.hidden = false;
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(activity.active, true);
  assert.equal(activity.delta(50000), 0);
  assert.equal(activity.delta(16), 16);
  activity.destroy();
});

// eslint-disable-next-line max-lines-per-function -- Wiederholtes Anlegen und Entfernen prüft beide Fensterereignisse und den Document-Listener zusammen.
test('Destroy entfernt sämtliche Lifecycle-Listener vor der nächsten Runde', () => {
  let changes = 0;
  const first = new PlayActivity(() => {
    changes++;
  });

  first.destroy();
  const second = new PlayActivity(() => {
    changes++;
  });

  browserWindow.dispatchEvent(new Event('blur'));
  browserWindow.dispatchEvent(new Event('focus'));
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(changes, 3);
  second.destroy();
  browserWindow.dispatchEvent(new Event('blur'));
  browserWindow.dispatchEvent(new Event('focus'));
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(changes, 3);
});

// eslint-disable-next-line max-lines-per-function -- Manuelle Pause muss unabhängig von Fokus und Sichtbarkeit bleiben und beim Fortsetzen Hintergrundzeit verwerfen.
test('Menüpause wird durch Fokus/Visibility nicht aufgehoben und umgeht keine Tab-Pause', () => {
  const activity = new PlayActivity(() => {});

  activity.setPaused(true);
  browserWindow.dispatchEvent(new Event('focus'));
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(activity.active, false);
  assert.equal(activity.delta(50_000), 0);
  browserWindow.dispatchEvent(new Event('blur'));
  activity.setPaused(false);
  assert.equal(activity.active, false);
  browserWindow.dispatchEvent(new Event('focus'));
  assert.equal(activity.active, true);
  assert.equal(activity.delta(50_000), 0);
  assert.equal(activity.delta(16), 16);
  activity.destroy();
});
