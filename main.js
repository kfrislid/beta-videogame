/* Phase 2.5: circle player with outline + coins + score */

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const PLAYER = {
  radius: 18,
  moveSpeed: 220,
  jumpSpeed: 420,
};

const WORLD = {
  gravityY: 900,
  killY: 650,
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

    this.spawnPoint = { x: 120, y: 420 };

    this.score = 0;
    this.scoreText = null;

    this.coinPositions = [
      { x: 260, y: 380 },
      { x: 520, y: 300 },
      { x: 760, y: 220 },
      { x: 140, y: 230 },
      { x: 420, y: 480 },
      { x: 860, y: 480 },
    ];
  }

  create() {
    this.cameras.main.setBackgroundColor("#1b1f2a");
    this.physics.world.gravity.y = WORLD.gravityY;

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(480, 520, 960, 40);
    this.addPlatform(260, 420, 240, 24);
    this.addPlatform(520, 340, 240, 24);
    this.addPlatform(760, 260, 220, 24);
    this.addPlatform(140, 270, 180, 24);

    // ---- Textures ----
    this.makePlayerTexture();
    this.makeCoinTexture();

    // ---- Player (circle sprite) ----
    this.player = this.physics.add.sprite(
      this.spawnPoint.x,
      this.spawnPoint.y,
      "player"
    );

    const body = this.player.body;
    body.setCircle(PLAYER.radius);
    body.setOffset(0, 0);
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(400, 900);
    body.setDragX(900);

    this.physics.add.collider(this.player, this.platforms);

    // ---- Coins ----
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

    // ---- Score ----
    this.score = 0;
    this.scoreText = this.add.text(12, 12, "Score: 0", {
      fontSize: "18px",
      color: "#e5e7eb",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    });

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

    if (this.player.y > WORLD.killY) {
      this.respawn();
    }
  }

  // ---------- Helpers ----------

  addPlatform(x, y, width, height) {
    const rect = this.add.rectangle(x, y, width, height, 0x3b82f6).setAlpha(0.85);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
    return rect;
  }

  makePlayerTexture() {
    if (this.textures.exists("player")) return;

    const size = PLAYER.radius * 2;
    const g = this.add.graphics();

    // Outer border
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
      b.setOffset(
        COIN.size / 2 - COIN.radius,
        COIN.size / 2 - COIN.radius
      );
      coin.refreshBody();
    });
  }

  collectCoin(coin) {
    coin.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.coins.countActive(true) === 0) {
      this.time.delayedCall(400, () => {
        this.coins.clear(true, true);
        this.spawnAllCoins();
      });
    }
  }

  respawn() {
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.body.setVelocity(0, 0);
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
