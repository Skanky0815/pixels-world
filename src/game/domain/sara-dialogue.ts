import {
  SARA_DIALOGUE,
  SARA_DIALOGUE_CATALOGUE,
  type SaraAnger,
  type SaraDialogueCatalogue,
} from '../../content/sara-reactions.ts';

export interface DialogueContext {
  readonly roomId?: string;
  readonly previousDialogue?: string;
  readonly damageTopic?: string;
}

/** Canonical content, not translated display text, identifies the last line of each room/stage. */
export class DialogueMemory {
  private readonly last = new Map<string, string>();

  previous(roomId: string | undefined, anger: SaraAnger) {
    return this.last.get(`${roomId ?? ''}/${anger}`);
  }

  remember(roomId: string | undefined, anger: SaraAnger, dialogue: string) {
    this.last.set(`${roomId ?? ''}/${anger}`, dialogue);
  }

  clear() {
    this.last.clear();
  }
}

/** Exactly one sample, no rerolls; missing room/stage data retains a safe generic fallback. */
// eslint-disable-next-line max-lines-per-function -- Typisierter Kontext und Katalog bleiben zusammen mit der einzelnen reproduzierbaren Auswahl sichtbar.
export function selectSaraDialogue(
  anger: SaraAnger,
  sample: number,
  context: DialogueContext = {},
  catalogue = SARA_DIALOGUE_CATALOGUE,
) {
  if (!Number.isFinite(sample) || sample < 0 || sample > 1)
    throw new Error('Invalid random sample');
  const pool =
    damagePool(anger, context.damageTopic, catalogue) ??
    dialoguePool(anger, context.roomId, catalogue);
  const fresh = pool.filter((line) => line !== context.previousDialogue);
  const available = fresh.length > 0 ? fresh : pool;

  return available[Math.min(available.length - 1, Math.floor(sample * available.length))];
}

function damagePool(anger: SaraAnger, topic: string | undefined, catalogue: SaraDialogueCatalogue) {
  const damage = catalogue.damage ?? {};
  const lines = topic && Object.hasOwn(damage, topic) ? (damage[topic]?.[anger] ?? []) : [];
  const clean = [...new Set(lines.filter((line) => line.trim().length > 0))];

  return clean.length > 0 ? clean : null;
}

// eslint-disable-next-line max-lines-per-function -- Generischer und raumbezogener Pool teilen dieselbe Bereinigung und sichere Ersatzzeile.
function dialoguePool(
  anger: SaraAnger,
  roomId: string | undefined,
  catalogue: SaraDialogueCatalogue,
) {
  const room =
    roomId && Object.hasOwn(catalogue.rooms, roomId) ? catalogue.rooms[roomId] : undefined;
  const lines = [...(catalogue.generic[anger] ?? []), ...(room?.[anger] ?? [])];
  const unique = [...new Set(lines.filter((line) => line.trim().length > 0))];

  return unique.length > 0 ? unique : [SARA_DIALOGUE[anger][0]];
}
