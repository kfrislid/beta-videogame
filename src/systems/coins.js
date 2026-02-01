export function createCoins(scene, coinPositions) {
  const coins = scene.physics.add.staticGroup();
  spawn(scene, coins, coinPositions);
  return coins;
}

export function resetCoins(scene, coins, coinPositions) {
  coins.clear(true, true);
  spawn(scene, coins, coinPositions);
}

function spawn(scene, coins, coinPositions) {
  const size = 24;
  const radius = 30;

  for (const p of coinPositions) {
    const coin = coins.create(p.x, p.y, "coin");
    const b = coin.body;

    b.setCircle(radius);
    b.setOffset(size / 2 - radius, size / 2 - radius);
    coin.refreshBody();
  }
}
