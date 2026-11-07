import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioPreferences, AUDIO_STORAGE_KEY, audioPreferences } from '../../src/settings/audio.ts';
import { GameAudio } from '../../src/game/ui/GameAudio.ts';

// eslint-disable-next-line max-lines-per-function -- Speichervertrag, Wiederherstellung und isolierte Snapshots gehören zum selben Präferenz-Ablauf.
test('Audioeinstellungen werden gespeichert, validiert und unveränderlich gelesen', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const preferences = new AudioPreferences(storage);

  preferences.update('master', 0.5);
  preferences.update('effects', 0.25);
  assert.deepEqual(new AudioPreferences(storage).snapshot(), { master: 0.5, effects: 0.25 });
  assert.equal(Object.isFrozen(preferences.snapshot()), true);
  preferences.update('master', NaN);
  preferences.update('effects', 2);
  assert.deepEqual(preferences.snapshot(), { master: 0.5, effects: 0.25 });
  values.set(AUDIO_STORAGE_KEY, '{broken');
  assert.deepEqual(new AudioPreferences(storage).snapshot(), { master: 1, effects: 1 });
});

// eslint-disable-next-line max-lines-per-function -- Getrennte Lese-/Schreibfehler dürfen die aktuelle Einstellung nicht blockieren.
test('Gesperrter Speicher verhindert die aktuelle Lautstärkeänderung nicht', () => {
  const preferences = new AudioPreferences({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });

  preferences.update('master', 0);
  assert.deepEqual(preferences.snapshot(), { master: 0, effects: 1 });
});

// eslint-disable-next-line max-lines-per-function -- Adapter prüft kombinierte Lautstärke, idempotente Pause und Abmeldung beim Szenenabbau.
test('Audioadapter kombiniert Pegel und entfernt seine Einstellungsbindung', () => {
  let paused = 0;
  let resumed = 0;
  const sound = {
    volume: 1,
    pauseOnBlur: true,
    stopAll() {},
    pauseAll() {
      paused++;
    },
    resumeAll() {
      resumed++;
    },
  };
  const audio = new GameAudio(sound);

  audioPreferences.update('master', 0.5);
  audioPreferences.update('effects', 0.25);
  assert.equal(sound.volume, 0.125);
  assert.equal(sound.pauseOnBlur, false);
  audio.setActive(false);
  audio.setActive(false);
  audio.setActive(true);
  assert.equal(paused, 1);
  assert.equal(resumed, 1);
  audio.destroy();
  audioPreferences.update('master', 1);
  assert.equal(sound.volume, 0.125);
  audioPreferences.update('effects', 1);
});
