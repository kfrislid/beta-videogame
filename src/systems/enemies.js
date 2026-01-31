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
  const size = 34;
  const bodyRadius = 14;
  const speed = 90;

  for (const e of enemyData) {
    const enemy = enemies.create(e.x, e.y, "enemy");

    enemy.setData("minX", e.minX);
    enemy.setData("maxX", e.maxX);
    enemy.setData("dir", 1);

    enemy.body.setCircle(bodyRadius);
    enemy.body.setOffset(size / 2 - bodyRadius, size / 2 - bodyRadius);

    enemy.body.setCollideWorldBounds(true);
    enemy.body.setAllowGravity(true);

    enemy.setVelocityX(speed);
  }
}

export function updateEnemies(enemies) {
  const speed = 90;

  enemies.children.iterate((enemy) => {
    if (!enemy || !enemy.active) return;

    const minX = enemy.getData("minX");
    const maxX = enemy.getData("maxX");
    let dir = enemy.getData("dir");

    if (enemy.x <= minX) dir = 1;
    if (enemy.x >= maxX) dir = -1;

    enemy.setData("dir", dir);
    enemy.setVelocityX(dir * speed);
    enemy.setFlipX(dir < 0);
  });
}

/**
 * Returns:
 * - "stomp" if enemy stomped (enemy removed)
 * - "hurt" if player should take damage
 */
export function handlePlayerEnemyCollision({ scene, player, enemy, stompBounce }) {
  const pBody = player.body;

  const playerFalling = pBody.velocity.y > 0;
  const playerAboveEnemy = player.y < enemy.y - 6;

  if (playerFalling && playerAboveEnemy) {
    enemy.disableBody(true, true);
    pBody.setVelocityY(-stompBounce);
    return "stomp";
  }

  return "hurt";
}
