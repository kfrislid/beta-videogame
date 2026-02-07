const Phaser = window.Phaser;

export function createEnemies(scene, enemyData) {
  const enemies = scene.physics.add.group();
  spawn(scene, enemies, enemyData);
  return enemies;
}

export function resetEnemies(scene, enemies, enemyData) {
  enemies.clear(true, true);
  spawn(scene, enemies, enemyData);
}

function spawn(scene, enemies, enemyData) {
  for (const e of enemyData) {
    const type = e.type || "ground";

    if (type === "fly") {
      spawnFlying(scene, enemies, e);
    } else {
      spawnGround(scene, enemies, e);
    }
  }
}

function spawnGround(scene, enemies, e) {
  const size = 34;
  const bodyRadius = 14;
  const speed = e.speed ?? 90;

  const enemy = enemies.create(e.x, e.y, "enemy");

  enemy.setData("type", "ground");
  enemy.setData("minX", e.minX);
  enemy.setData("maxX", e.maxX);
  enemy.setData("dir", 1);
  enemy.setData("speed", speed);

  enemy.body.setCircle(bodyRadius);
  enemy.body.setOffset(size / 2 - bodyRadius, size / 2 - bodyRadius);

  enemy.body.setCollideWorldBounds(true);
  enemy.body.setAllowGravity(true);

  enemy.setVelocityX(speed);
}

function spawnFlying(scene, enemies, e) {
  const w = 40;
  const h = 30;

  const speed = e.speed ?? 95;       // left/right px/sec
  const bobAmp = e.bobAmp ?? 18;     // vertical bob amplitude in px
  const bobSpeed = e.bobSpeed ?? 2;  // radians/sec

  const enemy = enemies.create(e.x, e.y, "enemy_fly");

  enemy.setData("type", "fly");
  enemy.setData("minX", e.minX);
  enemy.setData("maxX", e.maxX);
  enemy.setData("dir", 1);
  enemy.setData("speed", speed);

  enemy.setData("baseY", e.y);
  enemy.setData("bobAmp", bobAmp);
  enemy.setData("bobSpeed", bobSpeed);
  enemy.setData("phase", Math.random() * Math.PI * 2);

  // Body hitbox: slightly smaller than sprite
  enemy.body.setSize(w - 12, h - 12, true);
  enemy.body.setOffset(6, 6);

  enemy.body.setCollideWorldBounds(true);
  enemy.body.setAllowGravity(false);

  enemy.setVelocityX(speed);
}

export function updateEnemies(enemies, timeMs) {
  enemies.children.iterate((enemy) => {
    if (!enemy || !enemy.active) return;

    const type = enemy.getData("type") || "ground";
    const minX = enemy.getData("minX");
    const maxX = enemy.getData("maxX");
    let dir = enemy.getData("dir") ?? 1;
    const speed = enemy.getData("speed") ?? 90;

    if (enemy.x <= minX) dir = 1;
    if (enemy.x >= maxX) dir = -1;

    enemy.setData("dir", dir);
    enemy.setVelocityX(dir * speed);
    enemy.setFlipX(dir < 0);

    if (type === "fly") {
      const baseY = enemy.getData("baseY");
      const bobAmp = enemy.getData("bobAmp");
      const bobSpeed = enemy.getData("bobSpeed");
      const phase = enemy.getData("phase");

      const t = timeMs / 1000;
      enemy.y = baseY + Math.sin(t * bobSpeed + phase) * bobAmp;

      // Let Arcade know body moved
      enemy.body.updateFromGameObject();
    }
  });
}

/**
 * Returns:
 * - "stomp" if enemy stomped (enemy removed)
 * - "hurt" if player should take damage
 */
export function handlePlayerEnemyCollision({ scene, player, enemy, stompBounce }) {
  const pBody = player.body;

  // A little more forgiving stomp window for flying enemies
  const type = enemy.getData("type") || "ground";
  const abovePadding = type === "fly" ? 2 : 6;

  const playerFalling = pBody.velocity.y > 0;
  const playerAboveEnemy = player.y < enemy.y - abovePadding;

  if (playerFalling && playerAboveEnemy) {
    enemy.disableBody(true, true);
    pBody.setVelocityY(-stompBounce);
    return "stomp";
  }

  return "hurt";
}
