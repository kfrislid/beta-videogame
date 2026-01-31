/* Phase 1.5: platformer + coins + score
   - Move left/right
   - Jump
   - Platforms + gravity + collisions
   - Coins (overlap to collect)
   - Score UI
   - Fall off map = respawn (score stays)
   - R key = reset (score resets)
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

const COIN = {
  radius: 10,
  color: 0xfbbf24,
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

    // Ledges
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

    this.physics.add.existing(this.player);
    const body = this.player.body;

    body.setCollideWorldBounds(true);
    body.setSize(PLAYER.width, PLAYER.height);
    body.setOffset(-PLAYER.width / 2, -PLAYER.height / 2); // align rect to body
    body.setMaxVelocity(400, 900);
    body.setDragX(900);

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // --- Coins (static bodies, overlap pickup) ---
    this.coins = this.add.group();

    // Place coins around your level (you can add/remove positions)
    const coinPositions = [
      { x: 260, y: 380 },
      { x: 520, y: 300 },
      { x: 760, y: 220 },
      { x: 140, y: 230 },
      { x: 420, y: 480 },
      { x: 860, y: 480 },
    ];

    coinPositions.forEach((p) => this.spawnCoin(p.x, p.y));

    // Overlap: player collects coins
    this.physics.add.overlap(
      this.player,
      this.coins,
      (player, coin) => this.collectCoin(coin),
      null,
      this
    );

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Score UI
    this.score = 0;
    this.scoreText = this.add
      .text(12, 12, "Score: 0", {
        fontSize: "18px",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setScrollFactor(0);

    // Reset key (also resets score + respawns coins)
    this.keys.R.on("down", () => this.fullReset());
  }

  update() {
    const body = this.player.body;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    // Move
    if (left) {
      body.setVelocityX(-PLAYER.moveSpeed);
    } else if (right) {
      body.setVelocityX(PLAYER.moveSpeed);
    }

    // Jump (only if touching down)
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

  addPlatform(x, y, width, height) {
    const rect = this.add
      .rectangle(x, y, width, height, 0x3b82f6)
      .setAlpha(0.85);

    this.physics.add.existing(rect, true); // static body
    this.platforms.add(rect);
    return rect;
  }

  spawnCoin(x, y) {
    // Visual circle
    const coin = this.add.circle(x, y, COIN.radius, COIN.color);

    // Static physics body so overlap can detect it
    this.physics.add.existing(coin, true);

    // Add to group used by overlap
    this.coins.add(coin);
    return coin;
  }

  collectCoin(coin) {
    // Prevent double-collect edge cases
    if (!coin.active) return;

    coin.destroy();

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    // Optional: if all coins collected, respawn them
    if (this.coins.countActive(true) === 0) {
      this.time.delayedCall(400, () => this.respawnAllCoins());
    }
  }

  respawnAllCoins() {
    const coinPositions = [
      { x: 260, y: 380 },
      { x: 520, y: 300 },
      { x: 760, y: 220 },
      { x: 140, y: 230 },
      { x: 420, y: 480 },
      { x: 860, y: 480 },
    ];

    coinPositions.forEach((p) => this.spawnCoin(p.x, p.y));
  }

  respawn() {
    const body = this.player.body;
    this.player.x = this.spawnPoint.x;
    this.player.y = this.spawnPoint.y;
    body.setVelocity(0, 0);
  }

  fullReset() {
    // Reset score
    this.score = 0;
    this.scoreText.setText("Score: 0");

    // Remove existing coins
    this.coins.clear(true, true);

    // Respawn coins + player
    this.respawnAllCoins();
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
