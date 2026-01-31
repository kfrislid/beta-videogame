/* Phase 1: simple platformer basics
   - Move left/right
   - Jump
   - Platforms + gravity + collisions
   - Fall off map = respawn
   - R key = reset
*/

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const PLAYER = {
  width: 32,
  height: 48,
  moveSpeed: 220,
  jumpSpeed: 420,
};

const WORLD = {
  gravityY: 900,
  killY: 650, // if player falls below this, respawn
};

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.player = null;
    this.platforms = null;
    this.cursors = null;
    this.keys = null;
    this.spawnPoint = { x: 120, y: 420 };
    this.debugText = null;
  }

  preload() {
    // No external assets yet (we'll add sprites later).
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor("#1b1f2a");

    // Physics settings
    this.physics.world.gravity.y = WORLD.gravityY;

    // --- Platforms (static physics bodies) ---
    this.platforms = this.physics.add.staticGroup();

    // Ground
    this.addPlatform(480, 520, 960, 40);

    // Some ledges
    this.addPlatform(260, 420, 240, 24);
    this.addPlatform(520, 340, 240, 24);
    this.addPlatform(760, 260, 220, 24);
    this.addPlatform(140, 270, 180, 24);

    // --- Player (dynamic physics body) ---
    this.player = this.add.rectangle(
      this.spawnPoint.x,
      this.spawnPoint.y,
      PLAYER.width,
      PLAYER.height,
      0x4fe3c1
    );

    // Turn the rectangle into an arcade physics body
    this.physics.add.existing(this.player);

    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setSize(PLAYER.width, PLAYER.height);
    body.setOffset(-PLAYER.width / 2, -PLAYER.height / 2); // align rectangle to body
    body.setMaxVelocity(400, 900);
    body.setDragX(900); // makes stopping feel nicer

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Simple HUD text
    this.debugText = this.add.text(12, 12, "", {
      fontSize: "14px",
      color: "#cbd5e1",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    }).setScrollFactor(0);

    // Reset key
    this.keys.R.on("down", () => this.respawn());
  }

  update() {
    const body = this.player.body;

    const left =
      this.cursors.left.isDown || this.keys.A.isDown;
    const right =
      this.cursors.right.isDown || this.keys.D.isDown;

    // Move
    if (left) {
      body.setVelocityX(-PLAYER.moveSpeed);
    } else if (right) {
      body.setVelocityX(PLAYER.moveSpeed);
    } else {
      // letting dragX handle the slowdown feels smoother than hard-stopping
      // body.setVelocityX(0);
    }

    // Jump (only if touching down)
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

    if (jumpPressed && body.blocked.down) {
      body.setVelocityY(-PLAYER.jumpSpeed);
    }

    // Fell off the world => respawn
    if (this.player.y > WORLD.killY) {
      this.respawn();
    }

    // HUD info
    this.debugText.setText(
      `x: ${this.player.x.toFixed(0)}  y: ${this.player.y.toFixed(0)}  ` +
      `vx: ${body.velocity.x.toFixed(0)}  vy: ${body.velocity.y.toFixed(0)}`
    );
  }

  addPlatform(x, y, width, height) {
    // Visual rect
    const rect = this.add.rectangle(x, y, width, height, 0x3b82f6).setAlpha(0.85);

    // Static physics body
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
    return rect;
  }

  respawn() {
    const body = this.player.body;
    this.player.x = this.spawnPoint.x;
    this.player.y = this.spawnPoint.y;
    body.setVelocity(0, 0);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: WORLD.gravityY },
    },
  },
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
