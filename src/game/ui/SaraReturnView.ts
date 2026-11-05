import type Phaser from 'phaser';
import type { HomecomingSnapshot, SaraAnimation } from '../domain/homecoming';
import { SARA_ANIMATIONS } from '../../content/sara-reactions';
import { SARA_CLIPS, SARA_SPRITE } from '../actors/sara-animations';
import { homecomingPositions } from '../content/homecoming-layout';

const REACTION_LABELS = { calm: 'Skeptischer Blick', annoyed: 'Genervtes Seufzen', angry: '…' };

/** Scene-owned sprite and dialogue view; selection and timing stay in the domain. */
export class SaraReturnView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly actor: Phaser.GameObjects.Sprite;
  private caption = '';
  private readonly quote: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
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
    const panel = scene.add.rectangle(width / 2, 188, width - 80, 112, 0x403a35, 0.96);

    panel.setStrokeStyle(2, 0xd4b488);
    this.message = scene.add.text(60, 148, '', {
      ...this.textStyle(16),
      wordWrap: { width: width - 120 },
      lineSpacing: 6,
    });
    this.quote = scene.add.text(60, 172, '', {
      ...this.textStyle(16),
      fontStyle: 'italic',
      wordWrap: { width: width - 120 },
    });
    this.hint = scene.add.text(width - 60, 232, '', this.textStyle(14)).setOrigin(1, 1);
    this.root.add([door, knob, this.actor, panel, this.message, this.quote, this.hint]);
  }

  private buildActor() {
    registerAnimations(this.scene);

    return this.scene.add
      .sprite(this.layout.width + 32, this.layout.floorY, 'sara', 0)
      .setOrigin(SARA_SPRITE.origin.x, SARA_SPRITE.origin.y)
      .setScale(SARA_SPRITE.scale)
      .play(SARA_ANIMATIONS.idle);
  }

  render(snapshot: HomecomingSnapshot, canContinue = false) {
    const positions = homecomingPositions(this.layout.width);

    this.root.setVisible(snapshot.stage !== 'waiting');
    this.play(snapshot.animationKey);
    this.actor.x =
      positions.saraStartX + snapshot.entryProgress * (positions.saraEndX - positions.saraStartX);
    this.renderText(snapshot, canContinue);
  }

  private renderText(snapshot: HomecomingSnapshot, canContinue: boolean) {
    this.caption = messageFor(snapshot, canContinue);
    const dialogue = snapshot.stage === 'dialogue';
    const lines = this.caption.split('\n');

    this.message.setText(dialogue ? lines[0] : this.caption);
    this.quote.setText(dialogue ? lines[1] : '');
    this.hint.setText(dialogue ? lines[2] : '');
  }

  private play(key: SaraAnimation) {
    if (key === this.key) return;
    this.key = key;
    this.actor.play(key);
  }

  setPaused(paused: boolean) {
    if (paused) this.actor.anims.pause();
    else this.actor.anims.resume();
  }

  private textStyle(size: number) {
    return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf' };
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache nur lesbare Darstellungsvertrag enthält Anker, Textur und den tatsächlichen Animationsframe.
  snapshot() {
    return {
      visible: this.root.visible,
      animationKey: this.key,
      x: this.actor.x,
      soleY: this.actor.y,
      texture: this.actor.texture.key,
      frame: Number(this.actor.frame.name),
      displayHeight: this.actor.displayHeight,
      originY: this.actor.originY,
      dialogueText: this.caption,
    };
  }

  destroy() {
    this.root.destroy(true);
  }
}

// eslint-disable-next-line max-lines-per-function -- Die fünf Clips werden mit ihren zusammengehörigen Frames, Geschwindigkeiten und Wiederholungen registriert.
function registerAnimations(scene: Phaser.Scene) {
  for (const [key, clip] of Object.entries(SARA_CLIPS)) {
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: clip.frames.map((frame) => ({ key: 'sara', frame })),
      frameRate: clip.frameRate,
      repeat: clip.repeat,
    });
  }
}

function messageFor(snapshot: HomecomingSnapshot, canContinue: boolean) {
  if (snapshot.stage === 'waiting') return '';

  if (snapshot.stage === 'entering') return 'SARA\nDie Tür geht auf …';

  if (snapshot.stage === 'complete') return 'VERSÖHNUNG\nPixels Charme-Offensive beginnt …';

  if (snapshot.stage === 'dialogue') return dialogueMessage(snapshot, canContinue);

  return `SARA\n${snapshot.selection ? REACTION_LABELS[snapshot.selection.anger] : ''}`;
}

function dialogueMessage(snapshot: HomecomingSnapshot, canContinue: boolean) {
  const cue = canContinue ? 'LEERTASTE: Weiter' : 'Pixel kommt zu Sara …';

  return `SARA\n${snapshot.selection?.dialogue ?? ''}\n${cue}`;
}
