import type Phaser from 'phaser';
import { motionPreferences } from '../../settings/motion';
import { onLanguageChange, t } from '../../i18n/locale';
import type { TableclothPull } from '../interactions/tablecloth-pulling';
import type { TableclothConfig } from './Tablecloth';
export class TableclothArt {
  readonly root: Phaser.GameObjects.Container;
  private readonly top: Phaser.GameObjects.TileSprite;
  private readonly left: Phaser.GameObjects.TileSprite;
  private readonly tail: Phaser.GameObjects.TileSprite;
  private readonly pile: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Text;
  // eslint-disable-next-line max-lines-per-function -- Tischfläche, zwei Überhänge, Endzustand und lokalisierte Warnung teilen denselben Lebenszyklus.
  constructor(
    scene: Phaser.Scene,
    private readonly config: TableclothConfig,
  ) {
    const s = config.surface;

    this.top = scene.add
      .tileSprite(s.x, s.y - 6, s.width, 12, 'tablecloth-pattern')
      .setOrigin(0, 0);
    this.left = scene.add
      .tileSprite(s.x - 12, s.y, 24, config.hang, 'tablecloth-pattern')
      .setOrigin(0, 0);
    this.tail = scene.add
      .tileSprite(s.x + s.width - 12, s.y, 24, config.hang, 'tablecloth-pattern')
      .setOrigin(0, 0);
    this.pile = scene.add
      .image(s.x + s.width, config.floorY, 'tablecloth-pile')
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.hint = scene.add
      .text(s.x + s.width - 16, s.y - 12, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3c271e',
        backgroundColor: '#f3dfbd',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(1, 1)
      .setVisible(false);
    this.root = scene.add
      .container(0, 0, [this.top, this.left, this.tail, this.pile, this.hint])
      .setDepth(0.7);
    this.root.once(
      'destroy',
      onLanguageChange(() => this.hint.setText(t('tableclothWarning'))),
    );
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Beide Überhänge bleiben über dem Boden; Fläche, Stoffweg und Endzustand folgen der tatsächlichen Zugrichtung.
  render(
    state: ReturnType<TableclothPull['snapshot']>,
    time: number,
    nudge: boolean,
    side: number,
  ) {
    const s = this.config.surface;
    const offset = state.offset;

    this.top
      .setPosition(s.x + Math.max(0, Math.min(s.width, offset)), s.y - 6)
      .setSize(Math.max(1, s.width - Math.abs(offset)), 12)
      .setVisible(Math.abs(offset) < s.width);
    this.top.tilePositionX = -offset;
    const angle =
      motionPreferences.snapshot().reduced || (!nudge && state.state !== 'warning')
        ? 0
        : Math.sin(time / 65) * 0.035;

    this.drawTail(
      this.left,
      this.config.hang - offset,
      state.state !== 'displaced',
      offset,
      side < 0 ? angle : 0,
    );
    this.drawTail(
      this.tail,
      this.config.hang + offset,
      state.state !== 'displaced',
      -offset,
      side > 0 ? angle : 0,
    );
    this.pile
      .setPosition((Math.sign(offset) || side) < 0 ? s.x : s.x + s.width, this.config.floorY)
      .setFlipX((Math.sign(offset) || side) < 0)
      .setVisible(state.progress > 0)
      .setAlpha(state.progress);
    this.hint
      .setPosition(side < 0 ? s.x + 16 : s.x + s.width - 16, s.y - 12)
      .setOrigin(side < 0 ? 0 : 1, 1)
      .setText(t('tableclothWarning'))
      .setVisible(state.state === 'warning');
  }

  // eslint-disable-next-line max-lines-per-function -- Größe, Sichtbarkeit und Musterversatz desselben Überhangs ändern sich atomar, ohne bis zum Boden zu wachsen.
  private drawTail(
    tail: Phaser.GameObjects.TileSprite,
    length: number,
    visible: boolean,
    offset: number,
    angle: number,
  ) {
    const height = Math.max(0, Math.min(this.config.floorY - this.config.surface.y - 24, length));

    tail
      .setSize(24, Math.max(1, height))
      .setVisible(visible && height > 0)
      .setRotation(angle);
    tail.tilePositionY = offset;
  }

  // eslint-disable-next-line max-lines-per-function -- Nur losgelöste Größen, Sichtbarkeit und Winkel beider Stoffenden gelangen in den Beobachtungsvertrag.
  snapshot() {
    return {
      topVisible: this.top.visible,
      topWidth: this.top.width,
      leftVisible: this.left.visible,
      leftHeight: this.left.height,
      leftAngle: this.left.rotation,
      tailVisible: this.tail.visible,
      tailHeight: this.tail.height,
      tailAngle: this.tail.rotation,
      pileVisible: this.pile.visible,
      warningVisible: this.hint.visible,
    };
  }
}
