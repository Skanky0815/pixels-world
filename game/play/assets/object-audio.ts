import type Phaser from 'phaser';
import { OBJECT_CUES } from './object-cues';

const urls = import.meta.glob('../../../assets/audio/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function preloadObjectAudio(scene: Phaser.Scene) {
  for (const cue of OBJECT_CUES)
    for (let variant = 0; variant < 2; variant++)
      scene.load.audio(
        `object-${cue}-${variant}`,
        urls[`../../../assets/audio/${cue}-${variant}.wav`] as string,
      );
}
