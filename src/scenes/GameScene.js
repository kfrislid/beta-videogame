import { LEVELS } from "../levels.js";
import { ensureTextures } from "../systems/textures.js";
import { createUI } from "../systems/ui.js";
import { createPlayer, updatePlayerMovement, respawnPlayer, setPlayerFrozen, flashInvuln } from "../systems/player.js";
import { createCoins, resetCoins } from "../systems/coins.js";
import { createEnemies, updateEnemies, resetEnemies, handlePlayerEnemyCollision } from "../systems/enemies.js";
import { createGoal } from "../systems/goal.js";

const Phaser = window.Phaser;

const GAME = {
  livesStart: 3,
  invulnMs: 700,
  coinPoints: 10,
  enemyPoints: 50,
  stompBounce: 320,
  coyoteMs: 120,
  jumpBufferMs: 140,
};

const Mode = {
  PLAY: "play",
  WIN: "win",
  LOSE: "lose",
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.levelIndex = 0;
    this.level = null;

    this.platforms = null;
    this.player = null;
    this.coins = null;
    this.enemies = null;
    this.goal = null;

    this.ui = null;

    this.state = {
      mode: Mode.PLAY,
      score: 0,
      lives: GAME.livesStart,
      invulnerableUntil: 0,
      lastOnGroundAt: 0,
      lastJumpPressedAt: -9999,
    };

    this.keys = null;
    this.cursors = null;
  }

  create() {
    ensureTextures(this);

    this.level = LEVELS[this.levelIndex];

    // World bounds + camera bounds
    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.cameras.main.setBounds(0, 0, this.level.world.width, this.level.world.height);

    this.cameras.main.setBackgroundColor("#1b1f2a");

    // Build platforms
    this.platforms = this.physics.add.staticGroup();
    for (const p of this.level.platforms) this.addPlatform(p.x, p.y, p.w, p.h);

    // Player
    this.player = createPlayer(this, this.level.spawn.x, this.level.spawn.y);
    this.physics.add.collider(this.player, this.platforms);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(200, 120);

    // Coins
    this.coins = createCoins(this, this.level.coins);
    this.physics.add.overlap(this.player, this.coins, (player, coin) => {
      if (this.state.mode !== Mode.PLAY) return;
      coin.disableBody(true, true);
      this.state.score += GAME.coinPoints;
      this.ui.setScore(this.state.score);

      // Optional: respawn coins once all collected
      if (this.coins.countActive(true) === 0) {
        this.time.delayedCall(450, () => {
          if (this.state.mode !== Mode.PLAY) return;
          resetCoins(this, this.coins, this.level.coins);
        });
      }
    });

    // Enemies
    this.enemies = createEnemies(this, this.level.enemies);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
      if (this.state.mode !== Mode.PLAY) return;

      const result = handlePlayerEnemyCollision({
        scene: this,
        player: this.player,
        enemy,
        stompBounce: GAME.stompBounce,
      });

      if (result === "stomp") {
        this.state.score += GAME.enemyPoints;
        this.ui.setScore(this.state.score);
      } else if (result === "hurt") {
        this.loseLife();
      }
    });

    // Goal
    this.goal = createGoal(this, this.level.goal);
    this.physics.add.overlap(this.player, this.goal, () => {
      if (this.state.mode !== Mode.PLAY) return;
      this.win();
    });

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // UI
    this.ui = createUI(this, {
      onTryAgain: () => this.fullReset(),
    });
    this.ui.setScore(this.state.score);
    this.ui.setLives(this.state.lives);

    // Reset hotkey (dev/testing)
    this.keys.R.on("down", () => this.fullReset());
  }

  update(time) {
    if (this.state.mode !== Mode.PLAY) return;

    // Lose life if fell off world
    if (this.player.y > this.level.killY) {
      this.loseLife();
      return;
    }

    updatePlayerMovement({
      scene: this,
      player: this.player,
      cursors: this.cursors,
      keys: this.keys,
      time,
      state: this.state,
      feel: { coyoteMs: GAME.coyoteMs, jumpBufferMs: GAME.jumpBufferMs },
    });

    updateEnemies(this.enemies);
  }

  addPlatform(x, y, w, h) {
    const rect = this.add.rectangle(x, y, w, h, 0x3b82f6).setAlpha(0.85);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
  }

  loseLife() {
    const now = this.time.now;
    if (now < this.state.invulnerableUntil) return;

    this.state.lives -= 1;
    this.ui.setLives(this.state.lives);

    if (this.state.lives <= 0) {
      this.gameOver();
      return;
    }

    this.state.invulnerableUntil = now + GAME.invulnMs;
    flashInvuln(this, this.player);

    respawnPlayer(this.player, this.level.spawn);
  }

  gameOver() {
    this.state.mode = Mode.LOSE;

    this.physics.world.pause();
    setPlayerFrozen(this.player, true);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = false));

    this.ui.showOverlay({
      title: "YOU LOSE",
      showButton: true,
    });
  }

  win() {
    this.state.mode = Mode.WIN;

    this.physics.world.pause();
    setPlayerFrozen(this.player, true);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = false));

    this.ui.showOverlay({
      title: "YOU WIN!",
      showButton: false,
    });

    this.time.delayedCall(2000, () => {
      this.fullReset();
    });
  }

  fullReset() {
    // Resume physics
    this.physics.world.resume();

    // Reset state
    this.state.mode = Mode.PLAY;
    this.state.score = 0;
    this.state.lives = GAME.livesStart;
    this.state.invulnerableUntil = 0;
    this.state.lastOnGroundAt = 0;
    this.state.lastJumpPressedAt = -9999;

    // UI
    this.ui.hideOverlay();
    this.ui.setScore(this.state.score);
    this.ui.setLives(this.state.lives);

    // Reset coins/enemies
    resetCoins(this, this.coins, this.level.coins);
    resetEnemies(this, this.enemies, this.level.enemies);

    // Respawn player + unfreeze
    setPlayerFrozen(this.player, false);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = true));
    respawnPlayer(this.player, this.level.spawn);

    // Reset camera to start nicely
    this.cameras.main.stopFollow();
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }
}
