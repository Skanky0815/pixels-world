import type Phaser from 'phaser';
import type { DialoguePortrait } from '../domain/dialogue-portrait';
import sara from '../../../assets/team/sara-portrait-v1.png?url';
import pixel from '../../../assets/team/pixel-portrait-v3.png?url';
import surprised from '../../../assets/dialogue-portraits/sara-surprised-v1.png?url';
import annoyed from '../../../assets/dialogue-portraits/sara-annoyed-v1.png?url';
import friendly from '../../../assets/dialogue-portraits/sara-friendly-v1.png?url';

export const DIALOGUE_PORTRAITS: Readonly<Record<DialoguePortrait, string>> = {
  'sara-neutral': sara,
  'sara-surprised': surprised,
  'sara-annoyed': annoyed,
  'sara-friendly': friendly,
  'pixel-neutral': pixel,
};

export function preloadDialoguePortraits(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(DIALOGUE_PORTRAITS)) scene.load.image(key, url);
}
