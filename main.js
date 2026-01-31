/* Phase 5: goal flag + win screen + restart
   Includes:
   - Scrolling level + camera follow
   - Coins + score
   - Forgiving jumps (coyote + buffer)
   - Patrolling enemies (stomp or respawn)
   - Goal flag at end: YOU WIN! then restart
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
  points: 10,
};

const ENEMY = {
  size: 34,
  bodyRadius: 14,
  speed: 90,
  stompBounce: 320,
  points: 50,
};

const GOAL = {
  x: LEVEL.width - 140,  // near end of level
  y: 610,
  width: 18,
  height: 120,
};

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.player = null;
    this.platforms = null;
    this.coins = null;
    this.enemies = null;
    this.goal = null;

    this.cursors = null;
    this.keys = null;

    this.spawnPoint = { x: 120, y: 520 };

    this.score = 0;
    this.scoreText = null;

    this.coinPositions = [];
    this.enemyData = [];

    this.lastOnGroundAt = 0;
    this.lastJumpPressedAt = -9999;

    this.isWin = false;
    this.winText = null;
    this.winBackdrop = null;
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
      // a couple late platforms near the end for variety
      { x: 3420, y: 420, w: 240, h: 24 },
      { x: 3520, y: 520, w: 200, h: 24 },
    ];
    platformData.forEach((p) => this.addPlatform(p.x, p.y, p.w, p.h));

    // ---- Textures ----
    this.makePlayerTexture();
    this.makeCoinTexture();
    this.makeEnemyTexture();
    this.makeFlagTexture();

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
      // end stretch coins
      { x: 3420, y: 380 },
      { x: 3520, y: 480 },
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
    this.enemyData = [
      { x: 700, y: 440, minX: 580, maxX: 760 },
      { x: 1770, y: 420, minX: 1640, maxX: 1860 },
      { x: 2660, y: 400, minX: 2520, maxX: 2780 },
      { x: 3200, y: 640, minX: 3050, maxX: 3350 },
      // late enemy near end
      { x: 3450, y: 640, minX: 3360, maxX: 3560 },
    ];

    this.enemies = this.physics.add.group();
    this.spawnAllEnemies();

    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.collider(
      this.player,
      this.enemies,
      (player, enemy) => this.handlePlayerEnemyCollision(enemy),
      null,
      this
    );

    // ---- Goal Flag ----
    // A flag pole (static body) near the end
    this.goal = this.physics.add.staticSprite(GOAL.x, GOAL.y, "flag");
    this.goal.refreshBody();

    // Trigger win on overlap
    this.physics.add.overlap(
      this.player,
      this.goal,
      () => this.winLevel(),
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

    // R still resets (handy for testing)
    this.keys.R.on("down", () => this.fullReset());

    // ---- Win overlay (hidden until win) ----
    this.winBackdrop = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setScrollFactor(0)
      .setVisible(false);

    this.winText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "YOU WIN!", {
        fontSize: "52px",
        color: "#ffffff",
        fontStyle: "800",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);
  }

  update(time) {
    if (this.isWin) {
      // freeze input/movement after win
      return;
    }

    const body = this.player.body;

    if (body.blocked.down) {
      this.lastOnGroundAt = time;
    }

    // Move
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (left) body.setVelocityX(-PLAYER.moveSpeed);
    else if (right) body.setVelocityX(PLAYER.moveSpeed);

    // Jump buffer + coyote time
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

    // Enemy patrol
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

    g.fillStyle(0xef4444, 1);
    g.fillRoundedRect(2, 6, s - 4, s - 10, 8);

    g.fillStyle(0x111827, 1);
    g.fillCircle(s / 2 - 6, s / 2, 3);
    g.fillCircle(s / 2 + 6, s / 2, 3);

    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(s / 2 - 9, s / 2 - 6, 3);

    g.generateTexture("enemy", s, s);
    g.destroy();
  }

  makeFlagTexture() {
    if (this.textures.exists("flag")) return;

    const w = GOAL.width;
    const h = GOAL.height;

    const g = this.add.graphics();

    // pole
    g.fillStyle(0xe5e7eb, 1);
    g.fillRoundedRect(w / 2 - 3, 0, 6, h, 3);

    // flag cloth
    g.fillStyle(0x22c55e, 1);
    g.fillTriangle(w / 2 + 3, 12, w / 2 + 3, 44, w - 2, 28);

    // little accent
    g.fillStyle(0x16a34a, 1);
    g.fillTriangle(w / 2 + 6, 16, w / 2 + 6, 40, w - 6, 28);

    g.generateTexture("flag", w, h);
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
    if (this.isWin) return;

    coin.disableBody(true, true);

    this.score += COIN.points;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.coins.countActive(true) === 0) {
      this.time.delayedCall(450, () => {
        if (this.isWin) return;
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
      enemy.setData("dir", 1);

      enemy.body.setCircle(ENEMY.bodyRadius);
      enemy.body.setOffset(
        ENEMY.size / 2 - ENEMY.bodyRadius,
        ENEMY.size / 2 - ENEMY.bodyRadius
      );

      enemy.body.setCollideWorldBounds(true);
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

      if (enemy.x <= minX) dir = 1;
      if (enemy.x >= maxX) dir = -1;

      enemy.setData("dir", dir);
      enemy.setVelocityX(dir * ENEMY.speed);
      enemy.setFlipX(dir < 0);
    });
  }

  handlePlayerEnemyCollision(enemy) {
    if (this.isWin) return;

    const pBody = this.player.body;

    const playerFalling = pBody.velocity.y > 0;
    const playerAboveEnemy = this.player.y < enemy.y - 6;

    if (playerFalling && playerAboveEnemy) {
      // stomp
      enemy.disableBody(true, true);
      pBody.setVelocityY(-ENEMY.stompBounce);

      this.score += ENEMY.points;
      this.scoreText.setText(`Score: ${this.score}`);
      return;
    }

    // damage
    this.respawn();
  }

  // ---------- Goal / Win ----------
  winLevel() {
    if (this.isWin) return;

    this.isWin = true;

    // Stop movement
    this.player.body.setVelocity(0, 0);
    this.player.body.moves = false;

    // Stop enemies
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      enemy.body.setVelocity(0, 0);
      enemy.body.moves = false;
    });

    // Show overlay
    this.winBackdrop.setVisible(true);
    this.winText.setVisible(true);

    // Restart after short delay
    this.time.delayedCall(2000, () => {
      this.fullReset();
      this.isWin = false;
    });
  }

  // ---------- Respawn / Reset ----------
  respawn() {
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.body.setVelocity(0, 0);
  }

  fullReset() {
    // Re-enable movement (in case we won)
    this.player.body.moves = true;

    this.enemies.children.iterate((enemy) => {
      if (!enemy) return;
      if (enemy.body) enemy.body.moves = true;
    });

    // Hide win overlay
    if (this.winBackdrop) this.winBackdrop.setVisible(false);
    if (this.winText) this.winText.setVisible(false);

    // Reset score
    this.score = 0;
    this.scoreText.setText("Score: 0");

    // Reset coins
    this.coins.clear(true, true);
    this.spawnAllCoins();

    // Reset enemies
    this.enemies.clear(true, true);
    this.spawnAllEnemies();

    // Respawn player
    this.respawn();

    // Snap camera back near start quickly (feels better after win)
    this.cameras.main.stopFollow();
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
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
