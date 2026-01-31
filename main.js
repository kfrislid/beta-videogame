/* Phase 3: scrolling level + camera follow + coins + score + circle player */

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

// Wider world for scrolling
const LEVEL = {
  width: 3600,
  height: 720,
};

const PLAYER = {
  radius: 18,
  moveSpeed: 240,
  jumpSpeed: 450,
};

const WORLD = {
  gravityY: 950,
  killY: 780, // below level = respawn
};

const COIN = {
  size: 24,
  radius: 10,
};

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.player = null;
    this.platforms = null;
    this.coins = null;

    this.cursors = null;
    this.keys = null;

    this.spawnPoint = { x: 120, y: 520 };

    this.score = 0;
    this.scoreText = null;

    this.coinPositions = [];
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor("#1b1f2a");

    // Physics gravity
    this.physics.world.gravity.y = WORLD.gravityY;

    // World bounds (IMPORTANT for scrolling + camera)
    this.physics.world.setBounds(0, 0, LEVEL.width, LEVEL.height);

    // Camera bounds so it doesn’t scroll beyond the world
    this.cameras.main.setBounds(0, 0, LEVEL.width, LEVEL.height);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();

    // Ground: long strip across the whole level
    this.addPlatform(LEVEL.width / 2, 680, LEVEL.width, 60);

    // A bunch of platforms sprinkled throughout the level
    const platformData = [
      { x: 350, y: 560, w: 240, h: 24 },
      { x: 650, y: 480, w: 240, h: 24 },
      { x: 980, y: 420, w: 260, h: 24 },
      { x: 1250, y: 520, w: 220, h: 24 },
      { x: 1500, y: 360, w: 260, h: 24 },
      { x: 1750, y: 460, w: 240, h: 24 },
      { x: 2050, y: 400, w: 260, h: 24 },
      { x: 2350, y: 520, w: 260, h: 24 },
      { x: 2650, y: 440, w: 260, h: 24 },
      { x: 2950, y: 360, w: 260, h: 24 },
      { x: 3250, y: 480, w: 260, h: 24 },
    ];

    platformData.forEach((p) => this.addPlatform(p.x, p.y, p.w, p.h));

    // ---- Textures ----
    this.makePlayerTexture();
    this.makeCoinTexture();

    // ---- Player (circle sprite with arcade body) ----
    this.player = this.physics.add.sprite(
      this.spawnPoint.x,
      this.spawnPoint.y,
      "player"
    );

    const body = this.player.body;
    body.setCircle(PLAYER.radius);
    body.setOffset(0, 0);
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(500, 1000);
    body.setDragX(1100);

    this.physics.add.collider(this.player, this.platforms);

    // ---- Camera follow ----
    // Start following the player with a little smoothing (lerp)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Optional: small “deadzone” so camera doesn’t move on tiny player motions
    this.cameras.main.setDeadzone(200, 120);

    // ---- Coins ----
    // Place coins near platforms across the larger level
    this.coinPositions = [
      { x: 350, y: 520 },
      { x: 650, y: 440 },
      { x: 980, y: 380 },
      { x: 1250, y: 480 },
      { x: 1500, y: 320 },
      { x: 1750, y: 420 },
      { x: 2050, y: 360 },
      { x: 2350, y: 480 },
      { x: 2650, y: 400 },
      { x: 2950, y: 320 },
      { x: 3250, y: 440 },

      // a few ground coins for variety
      { x: 520, y: 640 },
      { x: 1120, y: 640 },
      { x: 1880, y: 640 },
      { x: 2520, y: 640 },
      { x: 3400, y: 640 },
    ];

    this.coins = this.physics.add.staticGroup();
    this.spawnAllCoins();

    this.physics.add.overlap(
      this.player,
      this.coins,
      (player, coin) => this.collectCoin(coin),
      null,
      this
    );

    // ---- Input ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // ---- Score UI (fixed to screen) ----
    this.score = 0;
    this.scoreText = this.add
      .text(12, 12, "Score: 0", {
        fontSize: "18px",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setScrollFactor(0); // stays on screen while camera moves

    // Reset
    this.keys.R.on("down", () => this.fullReset());
  }

  update() {
    const body = this.player.body;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (left) body.setVelocityX(-PLAYER.moveSpeed);
    else if (right) body.setVelocityX(PLAYER.moveSpeed);

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

    if (jumpPressed && body.blocked.down) {
      body.setVelocityY(-PLAYER.jumpSpeed);
    }

    // Fell off the world => respawn (score stays)
    if (this.player.y > WORLD.killY) {
      this.respawn();
    }
  }

  // ---------- Helpers ----------

  addPlatform(x, y, width, height) {
    const rect = this.add.rectangle(x, y, width, height, 0x3b82f6).setAlpha(0.85);
    this.physics.add.existing(rect, true); // static body
    this.platforms.add(rect);
    return rect;
  }

  makePlayerTexture() {
    if (this.textures.exists("player")) return;

    const size = PLAYER.radius * 2;
    const g = this.add.graphics();

    // Border
    g.lineStyle(4, 0x0f172a, 1);
    g.strokeCircle(size / 2, size / 2, PLAYER.radius - 2);

    // Fill
    g.fillStyle(0x4fe3c1, 1);
    g.fillCircle(size / 2, size / 2, PLAYER.radius - 4);

    g.generateTexture("player", size, size);
    g.destroy();
  }

  makeCoinTexture() {
    if (this.textures.exists("coin")) return;

    const g = this.add.graphics();

    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(COIN.size / 2, COIN.size / 2, COIN.size / 2 - 2);

    g.fillStyle(0xfde68a, 1);
    g.fillCircle(COIN.size / 2 - 3, COIN.size / 2 - 3, COIN.size / 2 - 8);

    g.fillStyle(0xf59e0b, 1);
    g.fillCircle(COIN.size / 2 + 2, COIN.size / 2 + 2, 3);

    g.generateTexture("coin", COIN.size, COIN.size);
    g.destroy();
  }

  spawnAllCoins() {
    this.coinPositions.forEach(({ x, y }) => {
      const coin = this.coins.create(x, y, "coin");
      const b = coin.body;

      b.setCircle(COIN.radius);
      b.setOffset(COIN.size / 2 - COIN.radius, COIN.size / 2 - COIN.radius);

      coin.refreshBody(); // important for static bodies
    });
  }

  collectCoin(coin) {
    coin.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    // If all collected, respawn after a short delay
    if (this.coins.countActive(true) === 0) {
      this.time.delayedCall(450, () => {
        this.coins.clear(true, true);
        this.spawnAllCoins();
      });
    }
  }

  respawn() {
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.body.setVelocity(0, 0);

    // Optional: snap camera back if you want respawn to “feel immediate”
    // this.cameras.main.pan(this.player.x, this.player.y, 150);
  }

  fullReset() {
    this.score = 0;
    this.scoreText.setText("Score: 0");

    this.coins.clear(true, true);
    this.spawnAllCoins();

    this.respawn();
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
