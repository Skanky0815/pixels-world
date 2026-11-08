import type Phaser from 'phaser';

/** Original synthesized paper/thud sound; no external recordings or network assets. */
// eslint-disable-next-line max-lines-per-function -- Ein kurzer deterministischer Puffer wird einmal erzeugt und über Phasers vorhandenen Pause-/Lautstärkekanal gespielt.
export function playBookImpact(scene: Phaser.Scene) {
  if (!('context' in scene.sound)) return;
  const context = scene.sound.context;
  const key = 'book-impact';

  if (!scene.cache.audio.exists(key)) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.18), context.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < samples.length; index++) {
      const t = index / context.sampleRate;

      samples[index] = (Math.sin(t * 2 * Math.PI * 115) + Math.sin(index * 12.9898) * 0.35) * Math.exp(-t * 32) * Math.min(1, t * 1000) * 0.2;
    }

    scene.cache.audio.add(key, buffer);
  }

  scene.sound.play(key);
}
