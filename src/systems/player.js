const Phaser = window.Phaser;

export function createPlayer(scene, x, y) {
  const player = scene.physics.add.sprite(x, y, "player");

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
