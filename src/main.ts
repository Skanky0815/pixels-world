import Phaser from 'phaser';
import './style.css';

const WIDTH = 960;
const HEIGHT = 540;
const FLOOR_Y = 468;
const CURTAIN = new Phaser.Geom.Rectangle(744, 112, 112, 356);

class LivingRoom extends Phaser.Scene {
  private pixel!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jump!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private climbing = false;
  private climbHint!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private platformCollider!: Phaser.Physics.Arcade.Collider;

  constructor() { super('LivingRoom'); }

  create() {
    this.drawRoom();
    this.makeCatTexture();
    this.platforms = this.physics.add.staticGroup();
    // Keep rendered furniture and its collision surfaces in the same coordinates.
    this.addPlatform(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
    this.addPlatform(180, 370, 254, 28);
    this.addPlatform(518, 304, 146, 16);
    this.addPlatform(648, 224, 96, 16);
    this.addPlatform(856, 154, 80, 16);
    this.pixel = this.physics.add.sprite(110, FLOOR_Y - 16, 'pixel');
    this.pixel.setBodySize(26, 26).setOffset(5, 6).setCollideWorldBounds(true);
    this.pixel.setMaxVelocity(260, 600);
    this.platformCollider = this.physics.add.collider(this.pixel, this.platforms);
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Pixel’s World requires keyboard input.');
    this.cursors = keyboard.createCursorKeys();
    this.jump = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.climbHint = this.add.text(800, 90, '↑ / ↓ CLIMB', { fontFamily: 'monospace', fontSize: '12px', color: '#fff1cf', backgroundColor: '#615047' }).setPadding(7, 5).setOrigin(0.5);
    this.status = this.add.text(26, 25, 'PIXEL · HOME ALONE', { fontFamily: 'monospace', fontSize: '12px', color: '#584637' });
    this.cameras.main.setBounds(0, 0, WIDTH, HEIGHT);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.clearCaptures());
    // A lost key-up on tab switch must never leave Pixel moving.
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, this.releaseKeys, this));
  }

  private releaseKeys() { this.input.keyboard?.resetKeys(); }

  private addPlatform(x: number, y: number, width: number, height: number) {
    const surface = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0);
    this.physics.add.existing(surface, true);
    this.platforms.add(surface);
  }

  private drawRoom() {
    const g = this.add.graphics();
    const rect = (x: number, y: number, w: number, h: number, color: number) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
    rect(0, 0, WIDTH, FLOOR_Y, 0xcbb192);
    rect(0, 0, WIDTH, 14, 0x927660);
    for (let x = 32; x < WIDTH; x += 64) rect(x, 14, 2, 440, 0xc4a789);
    rect(0, 340, WIDTH, 114, 0xa68a72);
    for (let x = 0; x < WIDTH; x += 48) rect(x, 344, 2, 110, 0x947963);
    rect(0, 454, WIDTH, 14, 0x705547);
    rect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y, 0x9f7154);
    for (let y = 484; y < HEIGHT; y += 24) rect(0, y, WIDTH, 2, 0x865c47);
    for (let x = 0; x < WIDTH; x += 96) rect(x, 470, 2, 14, 0x865c47);
    // Window and the clearly outlined curtain, which doubles as a climb zone.
    rect(700, 90, 164, 240, 0x705547);
    rect(708, 98, 148, 224, 0x91b1af);
    rect(714, 104, 134, 100, 0xb0c6b8);
    rect(777, 98, 8, 224, 0xe4d0ab);
    rect(708, 205, 148, 8, 0xe4d0ab);
    rect(730, 101, 140, 10, 0x59443d);
    rect(CURTAIN.x, CURTAIN.y, CURTAIN.width, CURTAIN.height, 0xa5654e);
    for (let x = 748; x < 856; x += 18) { rect(x, 112, 7, 356, 0xbd8060); rect(x + 7, 112, 4, 356, 0x95553f); }
    g.lineStyle(2, 0xeac791, 0.9).strokeRect(CURTAIN.x, CURTAIN.y, CURTAIN.width, CURTAIN.height);
    // Couch: a broad seat reachable from the floor.
    rect(190, 310, 232, 65, 0x687a63);
    rect(198, 318, 104, 46, 0x809077); rect(310, 318, 104, 46, 0x809077);
    rect(180, 370, 254, 28, 0x93a184);
    rect(180, 398, 254, 32, 0x596d57);
    rect(172, 348, 24, 69, 0x72866b); rect(418, 348, 24, 69, 0x72866b);
    rect(192, 430, 12, 38, 0x59443d); rect(410, 430, 12, 38, 0x59443d);
    rect(218, 335, 47, 32, 0xd7ab71);
    // Shelves: each visible top is also a solid physics platform.
    for (const [x, y, w] of [[518, 304, 146], [648, 224, 96], [856, 154, 80]]) {
      rect(x, y, w, 16, 0x70503e); rect(x, y, w, 4, 0xc49464);
      rect(x + 12, y + 16, 8, 20, 0x87644a); rect(x + w - 20, y + 16, 8, 20, 0x87644a);
    }
    rect(536, 270, 12, 34, 0xa7614e); rect(550, 278, 10, 26, 0x778775); rect(562, 266, 12, 38, 0xc6a36e);
    // Framed picture, plant, rug: decorative placeholders only.
    rect(282, 112, 108, 112, 0x795a43); rect(290, 120, 92, 96, 0xefe0ba);
    rect(302, 168, 68, 36, 0xa0a486); rect(322, 146, 28, 28, 0xd1a167);
    rect(60, 420, 44, 48, 0xb47655); rect(78, 356, 6, 64, 0x596d57);
    rect(58, 370, 24, 14, 0x718463); rect(82, 386, 26, 14, 0x718463);
    rect(245, 493, 430, 30, 0xbe906c); rect(255, 501, 410, 3, 0xddba8b);
    this.add.text(525, 336, 'SHELVES', { fontFamily: 'monospace', fontSize: '10px', color: '#725b46' });
  }

  private makeCatTexture() {
    if (this.textures.exists('pixel')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    const rect = (x: number, y: number, w: number, h: number, color: number) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
    rect(1, 14, 7, 5, 0x66574c); rect(1, 8, 4, 10, 0x66574c);
    rect(6, 13, 22, 15, 0x9b8a70); rect(21, 7, 13, 17, 0x9b8a70);
    rect(21, 2, 4, 9, 0x66574c); rect(30, 2, 4, 9, 0x66574c);
    rect(10, 14, 3, 9, 0x66574c); rect(17, 14, 3, 8, 0x66574c);
    rect(8, 27, 5, 5, 0x66574c); rect(23, 27, 5, 5, 0x66574c);
    rect(28, 13, 4, 3, 0xd9cf84); rect(31, 13, 1, 3, 0x302e2d);
    rect(28, 19, 7, 4, 0xe3cba4);
    g.generateTexture('pixel', 36, 32); g.destroy();
  }

  update() {
    if (!this.pixel) return;
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const horizontal = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const vertical = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);
    const overlapsCurtain = Phaser.Geom.Intersects.RectangleToRectangle(new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height), CURTAIN);
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jump);
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.climbing = false;
      this.pixel.setPosition(110, FLOOR_Y - 16).setVelocity(0, 0);
      body.setAllowGravity(true);
      this.platformCollider.active = true;
      return;
    }
    // Attach deliberately with Up/Down; jumping past the curtain remains possible.
    if (!this.climbing && overlapsCurtain && vertical !== 0 && !jumpPressed) this.climbing = true;
    if (this.climbing && !overlapsCurtain) this.climbing = false;
    body.setAllowGravity(!this.climbing);
    this.platformCollider.active = !this.climbing;
    if (this.climbing) {
      this.pixel.setVelocity(horizontal * 110, vertical * 125);
      if (jumpPressed) {
        this.climbing = false;
        body.setAllowGravity(true);
        this.platformCollider.active = true;
        this.pixel.setVelocity((horizontal || -1) * 240, -340);
      }
    } else {
      this.pixel.setVelocityX(horizontal * 230);
      if (jumpPressed && body.blocked.down) this.pixel.setVelocityY(-480);
    }
    if (horizontal !== 0) this.pixel.setFlipX(horizontal < 0);
    this.climbHint.setAlpha(overlapsCurtain ? 1 : 0.65);
    this.status.setText(this.climbing ? 'PIXEL · CURTAIN CLIMBING' : 'PIXEL · HOME ALONE');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  pixelArt: true,
  backgroundColor: '#cbb192',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene: LivingRoom,
});
