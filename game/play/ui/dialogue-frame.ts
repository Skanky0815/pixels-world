import type Phaser from 'phaser';
import { dialoguePanel, type DialoguePlacement } from '../content/dialogue-layout';

export function dialogueTextStyle(size = 16) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 6 };
}

/** Canvas adapter; content and the existing scene-owned lifetime stay with each view. */
// eslint-disable-next-line max-lines-per-function -- Panelgeometrie und gemeinsamer Rahmen werden als ein Darstellungsvertrag erzeugt.
export function dialogueFrame(
  scene: Phaser.Scene,
  roomWidth: number,
  placement: DialoguePlacement,
  result = false,
) {
  const bounds = dialoguePanel(roomWidth, placement);
  const panel = scene.add
    .rectangle(
      bounds.left + bounds.width / 2,
      result ? 260 : 235,
      bounds.width,
      result ? 310 : 218,
      0x403a35,
    )
    .setStrokeStyle(2, 0xd4b488);

  return { ...bounds, panel };
}

/** DOM adapter for the same frame; page-level navigation deliberately stays outside it. */
export function mountDialogueFrame(root: HTMLElement, placement: DialoguePlacement) {
  root.classList.add('dialogue-box');
  root.dataset.dialogueSide = placement.side;
}
