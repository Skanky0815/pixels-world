import type Phaser from 'phaser';
import type { HomecomingSnapshot, SaraAnimation } from '../domain/homecoming';
import { SARA_ANIMATIONS } from '../../content/sara-reactions';

const REACTION_LABELS = { calm: 'Skeptischer Blick', annoyed: 'Genervtes Seufzen', angry: '…' };
const REACTION_FACES = { calm: '–', annoyed: 'Hm.', angry: '!?' };

/** Temporary shapes behind the semantic animation contract; final artwork belongs to #88. */
export class SaraReturnView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly actor: Phaser.GameObjects.Container;
  private readonly face: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  private key: SaraAnimation = SARA_ANIMATIONS.idle;

  // eslint-disable-next-line max-lines-per-function -- Der deklarative Aufbau hält Tür, Figur und Dialogpanel mit ihrer gemeinsamen Raumgeometrie zusammen.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layout: { readonly width: number; readonly floorY: number },
  ) {
    this.root = scene.add.container(0, 0).setDepth(12).setVisible(false);
    const { width, floorY } = layout;
    const door = scene.add.rectangle(width - 36, floorY - 72, 64, 144, 0x705547);
    const knob = scene.add.circle(width - 57, floorY - 64, 4, 0xe4c182);

    this.actor = this.buildActor();
    this.face = scene.add.text(-12, -99, '–', this.textStyle(12));
    this.actor.add(this.face);
    const panel = scene.add.rectangle(width / 2, 188, width - 80, 112, 0x403a35, 0.96);

    panel.setStrokeStyle(2, 0xd4b488);
    this.message = scene.add.text(60, 148, '', {
      ...this.textStyle(16),
      wordWrap: { width: width - 120 },
      lineSpacing: 6,
    });
    this.root.add([door, knob, this.actor, panel, this.message]);
  }

  // eslint-disable-next-line max-lines-per-function -- Die vorläufige Figurenzeichnung bleibt als ein deklarativer Aufbau lesbar und wird durch #88 ersetzt.
  private buildActor() {
    const s = this.scene;
    const actor = s.add.container(this.layout.width + 32, this.layout.floorY);

    actor.add([
      s.add.rectangle(-10, -17, 14, 34, 0x302e31),
      s.add.rectangle(10, -17, 14, 34, 0x302e31),
      s.add.rectangle(0, -57, 42, 50, 0x414044),
      s.add.rectangle(21, -92, 12, 43, 0xdab676),
      s.add.rectangle(0, -101, 36, 32, 0xe6af84),
      s.add.rectangle(0, -119, 38, 10, 0xdab676),
      s.add.rectangle(-13, -106, 10, 9, 0x25242a),
      s.add.rectangle(0, -106, 10, 9, 0x25242a),
      s.add.text(-20, -145, 'Sara', this.textStyle(12)),
    ]);

    return actor;
  }

  render(snapshot: HomecomingSnapshot) {
    this.root.setVisible(snapshot.stage !== 'waiting');
    this.key = snapshot.animationKey;
    this.actor.x = this.layout.width + 32 - snapshot.entryProgress * 146;
    this.face.setText(snapshot.selection ? REACTION_FACES[snapshot.selection.anger] : '–');
    this.message.setText(messageFor(snapshot));
  }

  private textStyle(size: number) {
    return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf' };
  }

  snapshot() {
    return {
      visible: this.root.visible,
      animationKey: this.key,
      x: this.actor.x,
      dialogueText: this.message.text,
    };
  }

  destroy() {
    this.root.destroy(true);
  }
}

function messageFor(snapshot: HomecomingSnapshot) {
  if (snapshot.stage === 'waiting') return '';

  if (snapshot.stage === 'entering') return 'SARA\nDie Tür geht auf …';

  if (snapshot.stage === 'complete') return 'VERSÖHNUNG\nFortsetzung folgt · R: Neue Runde';

  if (snapshot.stage === 'dialogue') return `SARA\n${snapshot.selection?.dialogue ?? ''}`;

  return `SARA\n${snapshot.selection ? REACTION_LABELS[snapshot.selection.anger] : ''}`;
}
