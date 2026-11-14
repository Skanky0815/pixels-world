import type Phaser from 'phaser';
import { motionPreferences } from '../../settings/motion';
import { t } from '../../i18n/locale';
import type { TableclothPull } from '../interactions/tablecloth-pulling';
import type { TableclothConfig } from './Tablecloth';
export class TableclothArt {
  readonly root: Phaser.GameObjects.Container;
  private readonly top: Phaser.GameObjects.TileSprite;
  private readonly tail: Phaser.GameObjects.TileSprite;
  private readonly pile: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Text;
  // eslint-disable-next-line max-lines-per-function -- Beide Stoffflächen, begrenzter Endzustand und lokalisierte Warnung werden an derselben Tischgeometrie initialisiert.
  constructor(
    scene: Phaser.Scene,
    private readonly config: TableclothConfig,
  ) {
    const s = config.surface;

    this.top = scene.add
      .tileSprite(s.x, s.y - 6, s.width, 12, 'tablecloth-pattern')
      .setOrigin(0, 0);
    this.tail = scene.add
      .tileSprite(s.x + s.width - 12, s.y, 24, config.hang, 'tablecloth-pattern')
      .setOrigin(0, 0);
    this.pile = scene.add
      .image(s.x + s.width, config.floorY, 'tablecloth-pile')
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.hint = scene.add
      .text(s.x + s.width - 16, s.y + config.hang - 36, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3c271e',
        backgroundColor: '#f3dfbd',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(1, 1)
      .setVisible(false);
    this.root = scene.add
      .container(0, 0, [this.top, this.tail, this.pile, this.hint])
      .setDepth(0.7);
  }

  // eslint-disable-next-line max-lines-per-function -- Tischkante, hängendes Ende, Warnung und abgelegter Stoff folgen demselben tatsächlichen Fortschritt.
  render(state: ReturnType<TableclothPull['snapshot']>, time: number, nudge: boolean) {
    const s = this.config.surface;
    const width = Math.max(1, s.width - state.offset);
    const hanging = Math.min(this.config.floorY - s.y, this.config.hang + state.offset);

    this.top
      .setPosition(s.x + Math.min(s.width, state.offset), s.y - 6)
      .setSize(width, 12)
      .setVisible(state.offset < s.width);
    this.top.tilePositionX = -state.offset;
    this.tail.setSize(24, hanging).setVisible(state.state !== 'displaced');
    this.tail.tilePositionY = -state.offset;
    this.tail.setRotation(
      motionPreferences.snapshot().reduced || (!nudge && state.state !== 'warning')
        ? 0
        : Math.sin(time / 65) * 0.035,
    );
    this.pile.setVisible(state.progress > 0).setAlpha(state.progress);
    this.hint.setText(t('tableclothWarning')).setVisible(state.state === 'warning');
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständig losgelöste Darstellungsvertrag bleibt als flacher Beobachtungswert prüfbar.
  snapshot() {
    return {
      topVisible: this.top.visible,
      topWidth: this.top.width,
      tailVisible: this.tail.visible,
      tailHeight: this.tail.height,
      tailAngle: this.tail.rotation,
      pileVisible: this.pile.visible,
      warningVisible: this.hint.visible,
    };
  }
}
