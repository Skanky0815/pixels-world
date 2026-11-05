import type Phaser from 'phaser';
import { ARROW_LABELS, CHARM_LINES } from '../../content/reconciliation';
import type { ReconciliationSnapshot } from '../domain/reconciliation';
import { homecomingPositions } from '../content/homecoming-layout';

/** Placeholder affection feedback, using the existing actors without changing their physics. */
export class ReconciliationView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly message: Phaser.GameObjects.Text;
  private readonly affection: Phaser.GameObjects.Text;
  private readonly timer: Phaser.GameObjects.Rectangle;
  private readonly hearts: Phaser.GameObjects.Rectangle;

  // eslint-disable-next-line max-lines-per-function -- Panel, zwei benannte Leisten und Zuneigungsanzeige bilden eine zusammenhängende deklarative Ansicht.
  constructor(scene: Phaser.Scene, width: number, floorY: number) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    const panel = scene.add.rectangle(width / 2, 201, width - 80, 150, 0x403a35, 1);

    panel.setStrokeStyle(2, 0xd4b488);
    this.message = scene.add.text(60, 140, '', style(16));
    const heartTrack = scene.add.rectangle(60, 251, 260, 10, 0x66554e).setOrigin(0, 0.5);
    const timeTrack = scene.add.rectangle(width - 320, 251, 260, 10, 0x66554e).setOrigin(0, 0.5);

    const heartLabel = scene.add.text(60, 228, 'Herzen', style(12));
    const timeLabel = scene.add.text(width - 320, 228, 'Zeit für die nächste Taste', style(12));

    this.hearts = scene.add.rectangle(60, 251, 1, 10, 0xd99b9c).setOrigin(0, 0.5);
    this.timer = scene.add.rectangle(width - 320, 251, 1, 10, 0xe4c182).setOrigin(0, 0.5);
    this.affection = scene.add
      .text(homecomingPositions(width).pixelSeatX, floorY - 155, '', style(18))
      .setOrigin(0.5);
    this.root.add([
      panel,
      this.message,
      heartLabel,
      timeLabel,
      heartTrack,
      timeTrack,
      this.hearts,
      this.timer,
      this.affection,
    ]);
  }

  render(snapshot: ReconciliationSnapshot) {
    this.root.setVisible(snapshot.stage !== 'waiting');
    this.message.setText(charmText(snapshot));
    this.hearts.width = 260 * snapshot.progress;
    this.timer.width =
      snapshot.stage === 'input' ? (260 * snapshot.remainingMs) / snapshot.inputMs : 0;
    this.affection.setText(affectionText(snapshot));
  }

  destroy() {
    this.root.destroy(true);
  }
}

function style(size: number) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 6 };
}

function charmText(s: ReconciliationSnapshot) {
  if (s.stage === 'complete')
    return 'VERSÖHNT\nSara: Na komm her, du kleiner Chaoskater.\nR: Neue Runde';

  if (s.stage === 'finale')
    return 'VERSÖHNUNG GELUNGEN\nSara streichelt Pixel. Alles wieder gut.\nHerzen: voll';

  return `PIXELS CHARME-OFFENSIVE · Herzen ${s.successes}/${s.required}\n${instruction(s)}\n${saraLine(s)}`;
}

function instruction(s: ReconciliationSnapshot) {
  if (s.stage === 'input' && s.expected)
    return `JETZT: ${ARROW_LABELS[s.expected]} · Taste ${s.step + 1}/${s.length} · ${(s.remainingMs / 1000).toFixed(1)} s`;

  if (s.stage === 'cue')
    return s.feedback === 'correct'
      ? 'Richtig! · Nächste Taste gleich …'
      : 'Bereit? · Gleich kommt die nächste Taste …';

  return feedbackText(s.feedback);
}

function feedbackText(feedback: ReconciliationSnapshot['feedback']) {
  return {
    wrong: 'Falsche Taste · Neuer Versuch gleich!',
    timeout: 'Zeit vorbei · Neuer Versuch gleich!',
    sequence: 'Folge geschafft! · Ein Herz mehr.',
    none: '',
    correct: 'Richtig!',
  }[feedback];
}

function saraLine(s: ReconciliationSnapshot) {
  if (s.feedback === 'wrong' || s.feedback === 'timeout')
    return 'Sara: Ganz ruhig. Versuch es noch einmal.';

  return `Sara: ${CHARM_LINES[s.level][s.successes % 2]}`;
}

function affectionText(s: ReconciliationSnapshot) {
  if (s.stage === 'finale' || s.stage === 'complete') return '♥ ♥ ♥\nStreicheln';

  if (s.feedback === 'sequence') return '♥ · Anschmiegen';

  return s.feedback === 'correct' ? 'Prrrr …' : '';
}
