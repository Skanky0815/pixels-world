export type DialogueSide = 'left' | 'right';
export interface DialoguePlacement {
  readonly side: DialogueSide;
}

/** Older DEV definitions use the neutral left side, independently of Sara's entrance. */
export function resolveDialoguePlacement(value: DialoguePlacement | undefined): DialoguePlacement {
  return Object.freeze({ side: value?.side ?? 'left' });
}

/** The same room anchor is used by homecoming, reconciliation and the result. */
export function dialoguePanel(width: number, placement: DialoguePlacement) {
  const panelWidth = Math.min(width - 80, 610);
  const left = placement.side === 'right' ? width - 40 - panelWidth : 40;

  return Object.freeze({ left, width: panelWidth, right: left + panelWidth });
}
