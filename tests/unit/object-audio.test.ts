import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GameAudio } from '../../src/game/ui/GameAudio.ts';
import { audioPreferences } from '../../src/settings/audio.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { CUE_VOLUME } from '../../src/game/assets/object-cues.ts';

// eslint-disable-next-line max-lines-per-function -- Der Adapter zählt reale Spiel-/Stoppaufrufe und bildet die Browser-Freigabegrenze ab.
function setup() {
  const calls: { key: string; volume: number; loop?: boolean }[] = [];
  const removedKeys: string[] = [];
  let stopped = 0;
  let removed = 0;
  const sound = {
    volume: 1,
    pauseOnBlur: true,
    locked: false,
    context: { state: 'running' },
    playing: [] as unknown[],
    getAllPlaying() {
      return this.playing;
    },
    play(key: string, config: { volume: number }) {
      calls.push({ key, ...config });

      return true;
    },
    stopAll() {
      stopped++;
      this.playing = [];
    },
    removeByKey(key: string) {
      removedKeys.push(key);

      return 1;
    },
    removeAll() {
      removed++;
    },
    pauseAll() {},
    resumeAll() {},
  };
  const audio = new GameAudio(sound);

  audio.setActive(true);

  return { audio, sound, calls, removedKeys, stopped: () => stopped, removed: () => removed };
}

// eslint-disable-next-line max-lines-per-function -- Alle hörbaren Schadensarten und die ausgeklammerten Aktionen teilen denselben Routingvertrag.
test('Objektschäden besitzen eigene Pegel und wechseln Varianten; andere Aktionen bleiben still', () => {
  const { audio, calls } = setup();

  try {
    for (const kind of ['break', 'picture-fall', 'topple', 'shelf-damage', 'collapse'] as const)
      audio.playDamage(chaosEvent('object', kind, 1, 1));
    assert.deepEqual(
      calls.map((c) => c.key),
      [
        'object-vase-0',
        'object-picture-1',
        'object-books-0',
        'object-creak-1',
        'object-collapse-0',
      ],
    );
    assert.deepEqual(
      calls.map((c) => c.volume),
      ['vase', 'picture', 'books', 'creak', 'collapse'].map(
        (cue) => CUE_VOLUME[cue as keyof typeof CUE_VOLUME],
      ),
    );
    audio.playDamage(chaosEvent('couch', 'scratch', 1, 1));
    assert.equal(calls.length, 5);
    audio.playObject('vase');
    assert.equal(calls.at(-1)?.key, 'object-vase-1');
  } finally {
    audio.destroy();
  }
});

// eslint-disable-next-line max-lines-per-function -- Sperre, suspendierter Kontext und Gleichzeitigkeit verwerfen Ereignisse ohne spätere Wiedergabe.
test('Gesperrtes Audio und drei laufende Effekte blockieren keine Spielereignisse und erzeugen keinen Rückstau', () => {
  const { audio, sound, calls } = setup();

  try {
    sound.locked = true;
    audio.playObject('vase');
    sound.locked = false;
    sound.context.state = 'suspended';
    audio.playObject('books');
    sound.context.state = 'running';
    sound.playing = [1, 2, 3];
    audio.playObject('collapse');
    assert.equal(calls.length, 0);
    sound.playing = [1, 2];
    audio.playObject('picture');
    assert.equal(calls.length, 1);
  } finally {
    audio.destroy();
  }
});

// eslint-disable-next-line max-lines-per-function -- Beide Stummschaltungen, Pause/Resume und neue Instanz prüfen die gemeinsame Lebensdauergrenze.
test('Lautstärke, Pause, Reset und Abmeldung verhindern alte oder stumme Effekte', () => {
  const { audio, sound, calls, stopped, removed } = setup();

  try {
    audioPreferences.update('master', 0.5);
    audioPreferences.update('effects', 0.25);
    assert.equal(sound.volume, 0.125);
    audioPreferences.update('master', 0);
    audio.playObject('books');
    audioPreferences.update('master', 1);
    audioPreferences.update('effects', 0);
    audio.playObject('books');
    audioPreferences.update('effects', 1);
    audio.setActive(false);
    audio.setActive(false);
    audio.playObject('vase');
    assert.equal(stopped(), 1);
    audio.setActive(true);
    assert.equal(calls.length, 0);
    audio.playObject('books');
    assert.equal(calls.length, 1);
  } finally {
    audio.destroy();
    audioPreferences.update('master', 1);
    audioPreferences.update('effects', 1);
  }

  assert.equal(stopped(), 2);
  assert.equal(removed(), 2);
  const next = new GameAudio(sound);

  next.setActive(true);
  assert.equal(calls.length, 1);
  next.destroy();
});

// eslint-disable-next-line max-lines-per-function -- Die tatsächlich ausgelieferten PCM-Dateien werden auf Format, begrenzte Spitzen und unterschiedliche Varianten geprüft.
test('WAV-Assets sind kurz, unterscheidbar und unter Vollaussteuerung', () => {
  const root = new URL('../../assets/audio/', import.meta.url);
  const files = readdirSync(root).filter((name) => name.endsWith('.wav'));

  assert.equal(files.length, 26);

  for (const file of files) {
    const wav = readFileSync(new URL(file, root));

    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.readUInt32LE(24), 22050);
    assert.equal(wav.readUInt16LE(22), 1);
    assert.ok(wav.length < 90000);
    let peak = 0;

    for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    assert.ok(peak > 1000 && peak < 30000);

    if (file.endsWith('-0.wav'))
      assert.notDeepEqual(wav, readFileSync(new URL(file.replace('-0', '-1'), root)));
  }
});

// eslint-disable-next-line max-lines-per-function -- Wiederholte Frames, Wechsel und Ende derselben automatischen Aktion dürfen keine zusätzlichen Loops erzeugen.
test('Kratzen, Knabbern und Würgen haben jeweils einen abbrechbaren Aktionsloop', () => {
  const { audio, calls, removedKeys } = setup();

  try {
    audio.updatePixel('scratching', 100);

    for (let i = 0; i < 100; i++) audio.updatePixel('scratching', 100);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { key: 'object-scratch-0', volume: CUE_VOLUME.scratch, loop: true });
    audio.playDamage(chaosEvent('couch', 'scratch', 1, 3));
    assert.equal(calls.length, 1);
    audio.updatePixel('nibbling', 100);
    audio.updatePixel('wobbling', 100);
    assert.equal(calls.length, 2);
    audio.updatePixel('retching', 100);
    audio.updatePixel('idle', 100);
    assert.deepEqual(
      calls.map((c) => c.key),
      ['object-scratch-0', 'object-nibble-1', 'object-retch-0'],
    );
    assert.deepEqual(
      removedKeys,
      calls.map((c) => c.key),
    );
    audio.playDamage(chaosEvent('carpet', 'hairball', 1, 15));
    assert.deepEqual(calls.at(-1), {
      key: 'object-hairball-1',
      volume: CUE_VOLUME.hairball,
      loop: false,
    });
  } finally {
    audio.destroy();
  }
});

// eslint-disable-next-line max-lines-per-function -- Nur tatsächlicher Positionsfortschritt darf Vorhangreibung erzeugen, auch am oberen Anschlag und beim Wechsel nach unten.
test('Vorhangloops folgen echter Bewegung und enden am Anschlag', () => {
  const { audio, calls, removedKeys } = setup();

  try {
    audio.updatePixel('climbing', 100);
    audio.updatePixel('climbing', 100);
    assert.equal(calls.length, 0);
    audio.updatePixel('climbing', 99);
    audio.updatePixel('climbing', 98);
    assert.equal(calls.length, 1);
    audio.updatePixel('climbing', 98);
    assert.deepEqual(removedKeys, ['object-climb-0']);
    audio.updatePixel('sliding', 99);
    audio.updatePixel('sliding', 100);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].key, 'object-slide-1');
    audio.updatePixel('idle', 101);
    assert.equal(removedKeys.length, 2);
  } finally {
    audio.destroy();
  }
});

// eslint-disable-next-line max-lines-per-function -- Pause, beide Regler und volle Kapazität sind dieselben Freigabegrenzen für aktuelle Aktionen und Einzelgeräusche.
test('Aktionsloops respektieren Pause, Stummschaltung, Reset und das gemeinsame Stimmenlimit', () => {
  const { audio, sound, calls, removedKeys } = setup();

  try {
    sound.playing = [1, 2, 3];
    audio.updatePixel('retching', 100);
    assert.equal(calls.length, 0);
    sound.playing = [];
    audio.updatePixel('retching', 100);
    assert.equal(calls.length, 1);
    audio.setActive(false);
    audio.setActive(true);
    assert.equal(calls.length, 1);
    audio.updatePixel('idle', 100);
    assert.equal(calls.length, 1);
    audio.updatePixel('nibbling', 100);
    audioPreferences.update('effects', 0);
    assert.deepEqual(removedKeys, ['object-nibble-1']);
    audio.updatePixel('nibbling', 100);
    assert.equal(calls.length, 2);
    audioPreferences.update('effects', 1);
    audio.updatePixel('nibbling', 100);
    assert.equal(calls.length, 3);
    audioPreferences.update('master', 0);
    assert.equal(removedKeys.length, 2);
  } finally {
    audio.destroy();
    audioPreferences.update('master', 1);
    audioPreferences.update('effects', 1);
  }

  audio.updatePixel('retching', 100);
  assert.equal(calls.length, 3);
});

// eslint-disable-next-line max-lines-per-function -- Echte Bodenbewegung wird gemeinsam gegen Spawn, Wanddruck, Sprung, Fall, Vorhang und Abbruch abgegrenzt.
test('Schritte brauchen tatsächlichen Bodenfortschritt und stoppen sofort ohne Bewegung', () => {
  const { audio, calls, removedKeys } = setup();
  const pixel = { x: 100, y: 400, grounded: true, climbing: false, velocityX: 230, velocityY: 0 };

  try {
    audio.updateMovement('idle', pixel);
    audio.updateMovement('idle', pixel);
    assert.equal(calls.length, 0);
    audio.updateMovement('idle', { ...pixel, x: 110 });
    audio.updateMovement('idle', { ...pixel, x: 120 });
    assert.deepEqual(calls, [{ key: 'object-walk-0', volume: CUE_VOLUME.walk, loop: true }]);
    audio.updateMovement('idle', { ...pixel, x: 120 });
    assert.deepEqual(removedKeys, ['object-walk-0']);
    audio.updateMovement('idle', { ...pixel, x: 125, velocityY: -480 });
    audio.updateMovement('idle', { ...pixel, x: 130, grounded: false });
    audio.updateMovement('climbing', { ...pixel, x: 135, climbing: true });
    audio.updateMovement('idle', { ...pixel, x: 140, velocityX: 0 });
    assert.equal(calls.length, 1);
    audio.updateMovement('idle', { ...pixel, x: 150 });
    assert.equal(calls.length, 2);
    audio.updateMovement('nibbling', { ...pixel, x: 150, velocityX: 0 });
    assert.equal(calls.at(-1)?.key, 'object-nibble-0');
    assert.equal(removedKeys.at(-1), 'object-walk-1');
  } finally {
    audio.destroy();
  }
});
