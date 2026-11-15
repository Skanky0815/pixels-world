import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GameAudio } from '../../game/play/ui/GameAudio.ts';
import { audioPreferences } from '../../game/play/settings/audio.ts';
import { chaosEvent } from '../../game/play/domain/chaos-event.ts';
import { CUE_VOLUME } from '../../game/play/assets/object-cues.ts';

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
    pixelStep(audio, 'scratching', 100);

    for (let i = 0; i < 100; i++) pixelStep(audio, 'scratching', 100);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { key: 'object-scratch-0', volume: CUE_VOLUME.scratch, loop: true });
    audio.playDamage(chaosEvent('couch', 'scratch', 1, 3));
    assert.equal(calls.length, 1);
    pixelStep(audio, 'nibbling', 100);
    pixelStep(audio, 'wobbling', 100);
    assert.equal(calls.length, 2);
    pixelStep(audio, 'retching', 100);
    pixelStep(audio, 'idle', 100);
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
    pixelStep(audio, 'climbing', 100);
    pixelStep(audio, 'climbing', 100);
    assert.equal(calls.length, 0);
    pixelStep(audio, 'climbing', 99);
    pixelStep(audio, 'climbing', 98);
    assert.equal(calls.length, 1);
    pixelStep(audio, 'climbing', 98);
    assert.deepEqual(removedKeys, ['object-climb-0']);
    pixelStep(audio, 'sliding', 99);
    pixelStep(audio, 'sliding', 100);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].key, 'object-slide-1');
    pixelStep(audio, 'idle', 101);
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
    pixelStep(audio, 'retching', 100);
    assert.equal(calls.length, 0);
    sound.playing = [];
    pixelStep(audio, 'retching', 100);
    assert.equal(calls.length, 1);
    audio.setActive(false);
    audio.setActive(true);
    assert.equal(calls.length, 1);
    pixelStep(audio, 'idle', 100);
    assert.equal(calls.length, 1);
    pixelStep(audio, 'nibbling', 100);
    audioPreferences.update('effects', 0);
    assert.deepEqual(removedKeys, ['object-nibble-1']);
    pixelStep(audio, 'nibbling', 100);
    assert.equal(calls.length, 2);
    audioPreferences.update('effects', 1);
    pixelStep(audio, 'nibbling', 100);
    assert.equal(calls.length, 3);
    audioPreferences.update('master', 0);
    assert.equal(removedKeys.length, 2);
  } finally {
    audio.destroy();
    audioPreferences.update('master', 1);
    audioPreferences.update('effects', 1);
  }

  pixelStep(audio, 'retching', 100);
  assert.equal(calls.length, 3);
});

// eslint-disable-next-line max-lines-per-function -- Echte Bodenbewegung wird gemeinsam gegen Spawn, Wanddruck, Sprung, Fall, Vorhang und Abbruch abgegrenzt.
test('Schritte brauchen tatsächlichen Bodenfortschritt und stoppen sofort ohne Bewegung', () => {
  const { audio, calls, removedKeys } = setup();
  const pixel = { x: 100, y: 400, grounded: true, climbing: false, velocityX: 230, velocityY: 0 };

  try {
    movementStep(audio, 'idle', pixel);
    movementStep(audio, 'idle', pixel);
    assert.equal(calls.length, 0);
    movementStep(audio, 'idle', { ...pixel, x: 110 });
    movementStep(audio, 'idle', { ...pixel, x: 120 });
    assert.deepEqual(calls, [{ key: 'object-walk-0', volume: CUE_VOLUME.walk, loop: true }]);
    movementStep(audio, 'idle', { ...pixel, x: 120 });
    assert.deepEqual(removedKeys, ['object-walk-0']);
    movementStep(audio, 'idle', { ...pixel, x: 125, velocityY: -480 });
    movementStep(audio, 'idle', { ...pixel, x: 130, grounded: false });
    movementStep(audio, 'climbing', { ...pixel, x: 135, climbing: true });
    movementStep(audio, 'idle', { ...pixel, x: 140, velocityX: 0 });
    assert.equal(calls.length, 1);
    movementStep(audio, 'idle', { ...pixel, x: 150 });
    assert.equal(calls.length, 2);
    movementStep(audio, 'nibbling', { ...pixel, x: 150, velocityX: 0 });
    assert.equal(calls.at(-1)?.key, 'object-nibble-0');
    assert.equal(removedKeys.at(-1), 'object-walk-1');
  } finally {
    audio.destroy();
  }
});

const physicsSteps = new WeakMap<GameAudio, number>();

function movementStep(
  audio: GameAudio,
  action: string,
  pixel: Parameters<GameAudio['updateMovement']>[1],
) {
  const step = (physicsSteps.get(audio) ?? 0) + 1;

  physicsSteps.set(audio, step);
  audio.updateMovement(action, pixel, { step, x: pixel.x, y: pixel.y });
}

function pixelStep(audio: GameAudio, action: string, y: number) {
  movementStep(audio, action, {
    x: 0,
    y,
    grounded: false,
    climbing: ['climbing', 'sliding'].includes(action),
    velocityX: 0,
    velocityY: action === 'climbing' ? -100 : 100,
  });
}

for (const [action, cue, vx, vy] of [
  ['idle', 'walk', 230, 0],
  ['climbing', 'climb', 0, -100],
  ['sliding', 'slide', 0, 40],
] as const)
  for (const renderFrames of [1, 2, 4])
    // eslint-disable-next-line max-lines-per-function -- Dieselbe echte Fortschrittsfolge wird bei verschiedenen Render-/Physikverhältnissen bis zum Anschlag geprüft.
    test(`${cue}: ${renderFrames} Renderframes pro Physikschritt unterbrechen oder starten keinen Loop neu`, () => {
      const { audio, calls, removedKeys } = setup();
      const pixel = {
        x: 100,
        y: 100,
        grounded: action === 'idle',
        climbing: action !== 'idle',
        velocityX: vx,
        velocityY: vy,
      };
      let progress = { step: 0, x: 100, y: 100 };

      try {
        audio.updateMovement(action, pixel, progress);

        for (let step = 1; step <= 6; step++) {
          progress = { step, x: progress.x + (vx ? 2 : 0), y: progress.y + Math.sign(vy) };

          for (let render = 0; render < renderFrames; render++)
            audio.updateMovement(action, pixel, progress);
          assert.equal(calls.length, 1);
          assert.equal(removedKeys.length, 0);
        }

        // A real step without body movement is a stop even with requested velocity.
        progress = { ...progress, step: progress.step + 1 };
        audio.updateMovement(action, pixel, progress);
        assert.equal(removedKeys.length, 1);

        for (let render = 0; render < renderFrames; render++)
          audio.updateMovement(action, pixel, progress);
        assert.equal(calls.length, 1);
      } finally {
        audio.destroy();
      }
    });

// eslint-disable-next-line max-lines-per-function -- Ein Aktionswechsel ohne Physikschritt stoppt sofort; erst bestätigter Fortschritt startet die neue Bewegungsquelle.
test('Aktionswechsel, Absprung und Stillstand stoppen auch ohne neuen Physikschritt', () => {
  const { audio, calls, removedKeys } = setup();
  const pixel = { x: 100, y: 100, grounded: false, climbing: true, velocityX: 0, velocityY: -100 };
  const progress = { step: 1, x: 100, y: 99 };

  try {
    audio.updateMovement('climbing', pixel, { step: 0, x: 100, y: 100 });
    audio.updateMovement('climbing', pixel, progress);
    audio.updateMovement('sliding', { ...pixel, velocityY: 40 }, progress);
    assert.equal(removedKeys.length, 1);
    assert.equal(calls.length, 1);
    audio.updateMovement('sliding', { ...pixel, velocityY: 40 }, { step: 2, x: 100, y: 100 });
    assert.equal(calls.length, 2);
    audio.updateMovement('idle', { ...pixel, climbing: false }, { step: 2, x: 100, y: 100 });
    assert.equal(removedKeys.length, 2);
  } finally {
    audio.destroy();
  }
});

// eslint-disable-next-line max-lines-per-function -- Ein alter Bewegungsbefund darf nach Pause oder Mute keine neue Quelle anlegen.
test('Pause und Mute starten bei unverändertem Physikfortschritt keinen alten Laufloop neu', () => {
  const { audio, calls } = setup();
  const pixel = { x: 100, y: 100, grounded: true, climbing: false, velocityX: 230, velocityY: 0 };
  const progress = { step: 1, x: 102, y: 100 };

  try {
    audio.updateMovement('idle', pixel, { step: 0, x: 100, y: 100 });
    audio.updateMovement('idle', pixel, progress);
    audio.setActive(false);
    audio.setActive(true);
    audio.updateMovement('idle', pixel, progress);
    assert.equal(calls.length, 1);
    audio.updateMovement('idle', pixel, { step: 2, x: 104, y: 100 });
    assert.equal(calls.length, 2);
    audioPreferences.update('master', 0);
    audioPreferences.update('master', 1);
    audio.updateMovement('idle', pixel, { step: 2, x: 104, y: 100 });
    assert.equal(calls.length, 2);
  } finally {
    audio.destroy();
    audioPreferences.update('master', 1);
  }
});
