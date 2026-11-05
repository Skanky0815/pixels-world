import type Phaser from 'phaser';
import { ARROW_LABELS, CHARM_LINES } from '../../content/reconciliation';
import type { ReconciliationSnapshot } from '../domain/reconciliation';
import { homecomingPositions } from '../content/homecoming-layout';

/** Reading and timed input are visually separate; only the current arrow needs attention. */
export class ReconciliationView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly message: Phaser.GameObjects.Text;
  private readonly affection: Phaser.GameObjects.Text;
  private readonly key: Phaser.GameObjects.Text;
  private readonly tile: Phaser.GameObjects.Rectangle;
  private readonly timer: Phaser.GameObjects.Rectangle;
  private readonly timeTrack: Phaser.GameObjects.Rectangle;
  private readonly hearts: Phaser.GameObjects.Rectangle;

  // eslint-disable-next-line max-lines-per-function -- Deklarativer Aufbau trennt Lesetext, große Tastenkachel, zugehörige Zeit und Herzfortschritt räumlich.
  constructor(scene: Phaser.Scene, width: number, floorY: number) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    const panel = scene.add.rectangle(width / 2, 235, width - 80, 218, 0x403a35, 1);

    panel.setStrokeStyle(2, 0xd4b488);
    this.message = scene.add.text(60, 140, '', { ...style(16), wordWrap: { width: width - 120 } });
    this.tile = scene.add.rectangle(width / 2, 242, 100, 100, 0x615047).setStrokeStyle(3, 0xe4c182);
    this.key = scene.add.text(width / 2, 242, '', style(76)).setOrigin(0.5);
    this.timeTrack = scene.add.rectangle(width / 2 - 70, 306, 140, 8, 0x66554e).setOrigin(0, 0.5);
    this.timer = scene.add.rectangle(width / 2 - 70, 306, 1, 8, 0xe4c182).setOrigin(0, 0.5);
    const heartTrack = scene.add.rectangle(60, 331, 200, 8, 0x66554e).setOrigin(0, 0.5);
    const heartLabel = scene.add.text(60, 311, 'Herzen', style(12));

    this.hearts = scene.add.rectangle(60, 331, 1, 8, 0xd99b9c).setOrigin(0, 0.5);
    this.affection = scene.add
      .text(homecomingPositions(width).pixelSeatX, floorY - 120, '', style(18))
      .setOrigin(0.5);
    this.root.add([
      panel,
      this.message,
      this.tile,
      this.key,
      this.timeTrack,
      this.timer,
      heartTrack,
      heartLabel,
      this.hearts,
      this.affection,
    ]);
  }

  render(snapshot: ReconciliationSnapshot) {
    this.root.setVisible(snapshot.stage !== 'waiting');
    this.message.setText(charmText(snapshot));
    this.hearts.width = 200 * snapshot.progress;
    this.renderKey(snapshot);
    this.affection.setText(affectionText(snapshot));
  }

  private renderKey(s: ReconciliationSnapshot) {
    const active = s.stage === 'input';
    const preparing = s.stage === 'cue';

    this.tile.setVisible(active || preparing);
    this.key.setText(s.expected ? ARROW_LABELS[s.expected] : '…').setVisible(active || preparing);
    this.timeTrack.setVisible(active);
    this.timer.setVisible(active);
    this.timer.width = active ? (140 * s.remainingMs) / s.inputMs : 0;
  }

  destroy() {
    this.root.destroy(true);
  }
}

function style(size: number) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 8 };
}

function charmText(s: ReconciliationSnapshot) {
  if (s.stage === 'complete')
    return 'VERSÖHNT\nSara: Na komm her, du kleiner Chaoskater.\nR: Neue Runde';

  if (s.stage === 'finale') return 'VERSÖHNUNG GELUNGEN\nSara streichelt Pixel. Alles wieder gut.';

  if (s.stage === 'input') return `PFEILTASTE DRÜCKEN\nTaste ${s.step + 1} von ${s.length}`;

  if (s.stage === 'cue') return 'BEREIT …\nGleich erscheint die nächste Pfeiltaste.';

  return readingText(s);
}

function readingText(s: ReconciliationSnapshot) {
  if (s.stage === 'reading')
    return 'PIXELS CHARME-OFFENSIVE\nDrücke die große Pfeiltaste, sobald sie erscheint.\nSara: Na, kannst du mich wieder um die Pfote wickeln?\n\nLEERTASTE: Ich bin bereit';

  return `${feedbackText(s.feedback)}\n${saraLine(s)}\n\nLEERTASTE: Weiter`;
}

function feedbackText(feedback: ReconciliationSnapshot['feedback']) {
  return {
    wrong: 'Falsche Taste. Kein Herz verloren.',
    timeout: 'Zeit vorbei. Kein Herz verloren.',
    sequence: 'Folge geschafft! Ein Herz mehr.',
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
