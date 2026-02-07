import { LEVELS } from "../levels.js";
import { ensureTextures } from "../systems/textures.js";
import { createUI } from "../systems/ui.js";
import { ensureSfx } from "../systems/audio.js";
import {
  createPlayer,
  ensurePlayerAnimations,
  updatePlayerMovement,
  respawnPlayer,
  setPlayerFrozen,
  flashInvuln,
} from "../systems/player.js";
import {
  createMovingPlatforms,
  updateMovingPlatforms,
  carryPlayerWithPlatforms,
} from "../systems/movingPlatforms.js";
import { createCoins, resetCoins } from "../systems/coins.js";
import {
  createEnemies,
  updateEnemies,
  resetEnemies,
  handlePlayerEnemyCollision,
} from "../systems/enemies.js";
import { createGoal } from "../systems/goal.js";
import {
  createCheckpoints,
  setCheckpointActive,
  resetCheckpoints,
  getActiveCheckpointSpawn,
} from "../systems/checkpoints.js";

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
    this.movingPlatforms = null;
    this.player = null;
    this.coins = null;
    this.enemies = null;
    this.goal = null;

    this.checkpoints = null;

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
      // IMPORTANT: scene.restart() reuses this scene instance, so reset state each time
    this.physics.world.resume();
    this.state.mode = Mode.PLAY;
    this.state.invulnerableUntil = 0;
    this.state.lastOnGroundAt = 0;
    this.state.lastJumpPressedAt = -9999;
    
    ensureTextures(this);
    ensureSfx(this);
    ensurePlayerAnimations(this);

    this.level = LEVELS[this.levelIndex];

    // World bounds + camera bounds
    this.physics.world.setBounds(
      0,
      0,
      this.level.world.width,
      this.level.world.height
    );
    this.cameras.main.setBounds(
      0,
      0,
      this.level.world.width,
      this.level.world.height
    );

    this.cameras.main.setBackgroundColor("#1b1f2a");

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    for (const p of this.level.platforms) this.addPlatform(p.x, p.y, p.w, p.h);

    // Moving platforms
    this.movingPlatforms = createMovingPlatforms(this, this.level.movingPlatforms || []);


    // Player
    this.player = createPlayer(this, this.level.spawn.x, this.level.spawn.y);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    // --- Moving platform timing fix ---
    // Move platforms BEFORE physics collisions, then carry player AFTER collisions.
    // This removes the "jitter" caused by moving platforms in update().
    this.events.on("preupdate", (time, delta) => {
      const dt = delta / 1000;
      updateMovingPlatforms(this, this.movingPlatforms, dt);
    });

    this.events.on("postupdate", () => {
      carryPlayerWithPlatforms(this, this.player, this.movingPlatforms);
    });


    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(200, 120);

    // Checkpoints (optional per level)
    const cps = this.level.checkpoints ?? [];
    this.checkpoints = createCheckpoints(this, cps);

    this.physics.add.overlap(this.player, this.checkpoints, (player, cp) => {
      if (this.state.mode !== Mode.PLAY) return;
      if (cp.getData("active")) return;
    
      setCheckpointActive(this.checkpoints, cp);
      this.ui.toast("Checkpoint saved!", 900);
      this.sfx?.checkpoint();
    });
    
    // Coins
    this.coins = createCoins(this, this.level.coins);
    this.physics.add.overlap(this.player, this.coins, (player, coin) => {
      if (this.state.mode !== Mode.PLAY) return;
      coin.disableBody(true, true);
      this.state.score += GAME.coinPoints;
      this.ui.setScore(this.state.score);
      this.sfx?.coin();

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
        this.sfx?.stomp();
      } else if (result === "hurt") {
        this.loseLife();
        this.sfx?.hurt();
      }
    });

    // --- Spikes / Hazards ---
    this.spikes = this.physics.add.staticGroup();

    (this.level.spikes || []).forEach((p) => {
      const spike = this.spikes.create(p.x, p.y, "spike");
      spike.setOrigin(0.5, 0.5);

      // Slightly smaller hitbox so it feels fair
      spike.body.setSize(34, 18, true);
      spike.body.setOffset(3, 8);
    });

    // Player touching spikes = hurt
    this.physics.add.overlap(this.player, this.spikes, () => {
      if (this.state.mode !== Mode.PLAY) return;
      this.onPlayerHazardHit();
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
      M: Phaser.Input.Keyboard.KeyCodes.M,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.keys.M.on("down", () => {
      const muted = this.sfx?.toggleMute();
      this.ui.toast(muted ? "SFX muted" : "SFX unmuted", 700);
    });

    // UI
    this.ui = createUI(this, {
      onTryAgain: () => this.fullReset(),
      onHome: () => this.goHome(),
      onNextLevel: () => this.nextLevel(),
    });

    this.ui.setScore(this.state.score);
    this.ui.setLives(this.state.lives);

    // Reset hotkey (dev/testing)
    this.keys.R.on("down", () => this.fullReset());
  }

  onPlayerHazardHit() {
    // Prevent losing multiple lives instantly from overlap
    if (this._invulnUntil && this.time.now < this._invulnUntil) return;
    this._invulnUntil = this.time.now + 900;

    this.sfx?.hurt();

    // ✅ Best option: call the same function you already call on enemy damage.
    // Look in your enemy-hit logic and find what it calls.
    // Common names:
    // this.loseLife()
    // this.damagePlayer()
    // this.playerHit()
    //
    // For now, I’ll try loseLife() first if it exists:
    if (typeof this.loseLife === "function") {
      this.loseLife();
      return;
    }

    // Fallback: do a simple life loss + respawn based on your state system
    this.state.lives -= 1;
    this.ui.setLives(this.state.lives);

    if (this.state.lives <= 0) {
      this.gameOver();
    } else {
      // Use your existing respawn flow if you have it:
      if (typeof this.respawn === "function") this.respawn();
      else if (typeof this.respawnPlayer === "function") this.respawnPlayer();
      else {
        // absolute fallback: restart scene
        this.scene.restart();
      }
    }
  }


  update(time) {
    if (this.state.mode !== Mode.PLAY) return;

    // Fell off world -> lose life
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

  getRespawnPoint() {
    // If a checkpoint is active, respawn there; otherwise at level spawn
    const cp = getActiveCheckpointSpawn(this.checkpoints);
    return cp ?? { x: this.level.spawn.x, y: this.level.spawn.y };
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

    respawnPlayer(this.player, this.getRespawnPoint());
  }

  gameOver() {
    this.sfx?.lose();
    this.state.mode = Mode.LOSE;

    this.physics.world.pause();
    setPlayerFrozen(this.player, true);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = false));

    this.ui.showOverlay({
      title: "YOU LOSE",
      overlayMode: "lose",
      showHome: true,
    });
  }

  win() {
    this.sfx?.win();
    this.state.mode = Mode.WIN;
  
    this.physics.world.pause();
    setPlayerFrozen(this.player, true);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = false));
  
    this.ui.showOverlay({
      title: "YOU WIN!",
      overlayMode: "win",
      showHome: true,
    });
  }
  loadLevel(index) {
    this.levelIndex = index;

     // Safety: ensure we are not carrying "paused world" into next level
    this.physics.world.resume();
    this.state.mode = Mode.PLAY;

    this.scene.restart(); // rebuild scene using the new levelIndex
  }

  goHome() {
    // Clean up overlay + resume world so HomeScene isn't affected
    this.physics.world.resume();
    this.ui.hideOverlay();
  
    // Reset level index (optional). If you want to resume where you left off, remove this line.
    this.levelIndex = 0;
  
    // Switch scenes
    this.scene.start("HomeScene");
  }

  nextLevel() {
    const nextIndex = this.levelIndex + 1;
  
    if (nextIndex < LEVELS.length) {
      this.loadLevel(nextIndex);
    } else {
      // If no more levels, loop back to Level 1 (or change to a "You Beat The Game" screen later)
      this.loadLevel(0);
    }
  }

  fullReset() {
    this.physics.world.resume();

    this.state.mode = Mode.PLAY;
    this.state.score = 0;
    this.state.lives = GAME.livesStart;
    this.state.invulnerableUntil = 0;
    this.state.lastOnGroundAt = 0;
    this.state.lastJumpPressedAt = -9999;

    this.ui.hideOverlay();
    this.ui.setScore(this.state.score);
    this.ui.setLives(this.state.lives);

    resetCoins(this, this.coins, this.level.coins);
    resetEnemies(this, this.enemies, this.level.enemies);

    // Reset checkpoints (back to spawn)
    resetCheckpoints(this.checkpoints);

    setPlayerFrozen(this.player, false);
    this.enemies.children.iterate((e) => e?.body && (e.body.moves = true));
    respawnPlayer(this.player, { x: this.level.spawn.x, y: this.level.spawn.y });

    // Reset camera
    this.cameras.main.stopFollow();
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }
}
