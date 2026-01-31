/* Phase 4: scrolling level + coins + score + forgiving jumps + simple patrolling enemies
   - Enemies patrol back/forth
   - Touch enemy from side => respawn
   - Stomp enemy from above => enemy removed + points
*/

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const LEVEL = {
  width: 3600,
  height: 720,
};

const PLAYER = {
  radius: 18,
  moveSpeed: 260,
  jumpSpeed: 560,
};

const WORLD = {
  gravityY: 850,
  killY: 780,
};

const FEEL = {
  coyoteMs: 120,
  jumpBufferMs: 140,
};

const COIN = {
  size: 24,
  radius: 10,
};

const ENEMY = {
  size: 34,          // texture size
  bodyRadius: 14,    // physics circle
  speed: 90,         // patrol speed
  stompBounce: 320,  // little hop after stomping
  points: 50,
};

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.player = null;
    this.platforms = null;
    this.coins = null;
    this.enemies = null;

    this.cursors = null;
    this.keys = null;

    this.spawnPoint = { x: 120, y: 520 };

    this.score = 0;
    this.scoreText = null;

    this.coinPositions = [];
    this.enemyData = [];

    this.lastOnGroundAt = 0;
    this.lastJumpPressedAt = -9999;
  }

  create() {
    this.cameras.main.setBackgroundColor("#1b1f2a");

    this.physics.world.gravity.y = WORLD.gravityY;
    this.physics.world.setBounds(0, 0, LEVEL.width, LEVEL.height);

    this.cameras.main.setBounds(0, 0, LEVEL.width, LEVEL.height);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();

    // Ground across entire level
    this.addPlatform(LEVEL.width / 2, 680, LEVEL.width, 60);

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
    this.makeEnemyTexture();

    // ---- Player ----
    this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "player");

    const pBody = this.player.body;
    pBody.setCircle(PLAYER.radius);
    pBody.setOffset(0, 0);
    pBody.setCollideWorldBounds(true);
    pBody.setMaxVelocity(650, 1200);
    pBody.setDragX(1200);

    this.physics.add.collider(this.player, this.platforms);

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(200, 120);

    // ---- Coins ----
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

    // ---- Enemies ----
    // Each enemy has a patrol range [minX, maxX]
    this.enemyData = [
      { x: 700, y: 440, minX: 580, maxX: 760 },      // on platform around x=650
      { x: 1770, y: 420, minX: 1640, maxX: 1860 },   // on platform around x=1750
      { x: 2660, y: 400, minX: 2520, maxX: 2780 },   // on platform around x=2650
      { x: 3200, y: 640, minX: 3050, maxX: 3350 },   // ground patrol
    ];

    this.enemies = this.physics.add.group();
    this.spawnAllEnemies();

    // Enemies collide with platforms so they stay on ground/ledges
    this.physics.add.collider(this.enemies, this.platforms);

    // Player <> enemy interaction
    this.physics.add.collider(
      this.player,
      this.enemies,
      (player, enemy) => this.handlePlayerEnemyCollision(enemy),
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

    // ---- Score UI ----
    this.score = 0;
    this.scoreText = this.add
      .text(12, 12, "Score: 0", {
        fontSize: "18px",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setScrollFactor(0);

    this.keys.R.on("down", () => this.fullReset());
  }

  update(time) {
    const body = this.player.body;

    // Track ground time for coyote time
    if (body.blocked.down) {
      this.lastOnGroundAt = time;
    }

    // Move
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (left) body.setVelocityX(-PLAYER.moveSpeed);
    else if (right) body.setVelocityX(PLAYER.moveSpeed);

    // Jump buffer
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

    if (jumpJustPressed) {
      this.lastJumpPressedAt = time;
    }

    const buffered = time - this.lastJumpPressedAt <= FEEL.jumpBufferMs;
    const canCoyote = time - this.lastOnGroundAt <= FEEL.coyoteMs;

    if (buffered && (body.blocked.down || canCoyote)) {
      body.setVelocityY(-PLAYER.jumpSpeed);
      this.lastJumpPressedAt = -9999;
    }

    // Fell off world
    if (this.player.y > WORLD.killY) {
      this.respawn();
    }

    // Enemy patrol AI
    this.updateEnemies();
  }

  // ---------- Platforms ----------
  addPlatform(x, y, width, height) {
    const rect = this.add.rectangle(x, y, width, height, 0x3b82f6).setAlpha(0.85);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
    return rect;
  }

  // ---------- Textures ----------
  makePlayerTexture() {
    if (this.textures.exists("player")) return;

    const size = PLAYER.radius * 2;
    const g = this.add.graphics();

    g.lineStyle(4, 0x0f172a, 1);
    g.strokeCircle(size / 2, size / 2, PLAYER.radius - 2);

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

  makeEnemyTexture() {
    if (this.textures.exists("enemy")) return;

    const s = ENEMY.size;
    const g = this.add.graphics();

    // body
    g.fillStyle(0xef4444, 1);
    g.fillRoundedRect(2, 6, s - 4, s - 10, 8);

    // eyes
    g.fillStyle(0x111827, 1);
    g.fillCircle(s / 2 - 6, s / 2, 3);
    g.fillCircle(s / 2 + 6, s / 2, 3);

    // tiny highlight
    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(s / 2 - 9, s / 2 - 6, 3);

    g.generateTexture("enemy", s, s);
    g.destroy();
  }

  // ---------- Coins ----------
  spawnAllCoins() {
    this.coinPositions.forEach(({ x, y }) => {
      const coin = this.coins.create(x, y, "coin");
      const b = coin.body;

      b.setCircle(COIN.radius);
      b.setOffset(COIN.size / 2 - COIN.radius, COIN.size / 2 - COIN.radius);

      coin.refreshBody();
    });
  }

  collectCoin(coin) {
    coin.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.coins.countActive(true) === 0) {
      this.time.delayedCall(450, () => {
        this.coins.clear(true, true);
        this.spawnAllCoins();
      });
    }
  }

  // ---------- Enemies ----------
  spawnAllEnemies() {
    this.enemyData.forEach((e) => {
      const enemy = this.enemies.create(e.x, e.y, "enemy");

      enemy.setData("minX", e.minX);
      enemy.setData("maxX", e.maxX);
      enemy.setData("dir", 1); // 1 = right, -1 = left

      enemy.body.setCircle(ENEMY.bodyRadius);
      // Center the circle in the texture
      enemy.body.setOffset(ENEMY.size / 2 - ENEMY.bodyRadius, ENEMY.size / 2 - ENEMY.bodyRadius);

      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable(false);
      enemy.body.setAllowGravity(true);

      enemy.setVelocityX(ENEMY.speed);
    });
  }

  updateEnemies() {
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      const minX = enemy.getData("minX");
      const maxX = enemy.getData("maxX");
      let dir = enemy.getData("dir");

      // Turn around at patrol edges
      if (enemy.x <= minX) dir = 1;
      if (enemy.x >= maxX) dir = -1;

      enemy.setData("dir", dir);
      enemy.setVelocityX(dir * ENEMY.speed);

      // Flip visually (optional)
      enemy.setFlipX(dir < 0);
    });
  }

  handlePlayerEnemyCollision(enemy) {
    // If player is falling and hits enemy from above => stomp
    const pBody = this.player.body;
    const eBody = enemy.body;

    const playerFalling = pBody.velocity.y > 0;
    const playerAboveEnemy = this.player.y < enemy.y - 6;

    if (playerFalling && playerAboveEnemy) {
      // Stomp!
      enemy.disableBody(true, true);

      // Bounce up a bit
      pBody.setVelocityY(-ENEMY.stompBounce);

      // Score
      this.score += ENEMY.points;
      this.scoreText.setText(`Score: ${this.score}`);
      return;
    }

    // Otherwise: "damage" => respawn
    this.respawn();
  }

  // ---------- Respawn / Reset ----------
  respawn() {
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.body.setVelocity(0, 0);

    // Small optional invulnerability window could be added later
  }

  fullReset() {
    this.score = 0;
    this.scoreText.setText("Score: 0");

    // Reset coins
    this.coins.clear(true, true);
    this.spawnAllCoins();

    // Reset enemies
    this.enemies.clear(true, true);
    this.spawnAllEnemies();

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
