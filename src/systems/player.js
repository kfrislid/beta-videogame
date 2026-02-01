const Phaser = window.Phaser;

const ANIMS = {
  IDLE: "player-idle",
  RUN: "player-run",
  JUMP: "player-jump",
  FALL: "player-fall",
};

export function ensurePlayerAnimations(scene) {
  // Animations live on the global Animation Manager, so guard with exists().
  if (scene.anims.exists(ANIMS.IDLE)) return;

  // Frames come from the procedural spritesheet created in textures.js (key: player_anim)
  scene.anims.create({
    key: ANIMS.IDLE,
    frames: [{ key: "player_anim", frame: 0 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: ANIMS.RUN,
    frames: [
      { key: "player_anim", frame: 1 },
      { key: "player_anim", frame: 2 },
    ],
    frameRate: 10,
    repeat: -1,
  });

  scene.anims.create({
    key: ANIMS.JUMP,
    frames: [{ key: "player_anim", frame: 3 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: ANIMS.FALL,
    frames: [{ key: "player_anim", frame: 4 }],
    frameRate: 1,
    repeat: -1,
  });
}

export function createPlayer(scene, x, y) {
  const player = scene.physics.add.sprite(x, y, "player_anim", 0);

  const radius = 18;
  const body = player.body;
  body.setCircle(radius);
  body.setOffset(0, 0);
  body.setCollideWorldBounds(true);
  body.setMaxVelocity(650, 1200);
  body.setDragX(1200);

  return player;
}

export function updatePlayerMovement({ scene, player, cursors, keys, time, state, feel }) {
  const body = player.body;

  // Track ground for coyote time
  if (body.blocked.down) state.lastOnGroundAt = time;

  const left = cursors.left.isDown || keys.A.isDown;
  const right = cursors.right.isDown || keys.D.isDown;

  const moveSpeed = 260;
  const jumpSpeed = 560;

  if (left) body.setVelocityX(-moveSpeed);
  else if (right) body.setVelocityX(moveSpeed);

  const jumpJustPressed =
    Phaser.Input.Keyboard.JustDown(cursors.up) ||
    Phaser.Input.Keyboard.JustDown(keys.W) ||
    Phaser.Input.Keyboard.JustDown(keys.SPACE);

  if (jumpJustPressed) state.lastJumpPressedAt = time;

  const buffered = time - state.lastJumpPressedAt <= feel.jumpBufferMs;
  const canCoyote = time - state.lastOnGroundAt <= feel.coyoteMs;

  if (buffered && (body.blocked.down || canCoyote)) {
    body.setVelocityY(-jumpSpeed);
    state.lastJumpPressedAt = -9999;
  }

  updatePlayerAnimation(player);
}

export function updatePlayerAnimation(player) {
  const body = player.body;
  if (!body) return;

  // If we froze movement (win/lose overlays), keep the player idle.
  if (!body.moves) {
    player.anims.play(ANIMS.IDLE, true);
    return;
  }

  // Facing direction
  if (Math.abs(body.velocity.x) > 5) {
    player.setFlipX(body.velocity.x < 0);
  }

  const onGround = body.blocked.down;

  if (!onGround) {
    if (body.velocity.y < 0) player.anims.play(ANIMS.JUMP, true);
    else player.anims.play(ANIMS.FALL, true);
    return;
  }

  if (Math.abs(body.velocity.x) > 10) {
    player.anims.play(ANIMS.RUN, true);
  } else {
    player.anims.play(ANIMS.IDLE, true);
  }
}

export function respawnPlayer(player, spawn) {
  player.setPosition(spawn.x, spawn.y);
  player.body.setVelocity(0, 0);
}

export function setPlayerFrozen(player, frozen) {
  player.body.moves = !frozen;
  if (frozen) player.body.setVelocity(0, 0);
}

export function flashInvuln(scene, player) {
  scene.tweens.killTweensOf(player);
  player.setAlpha(1);

  scene.tweens.add({
    targets: player,
    alpha: 0.25,
    duration: 90,
    yoyo: true,
    repeat: 6,
    onComplete: () => player.setAlpha(1),
  });
}
