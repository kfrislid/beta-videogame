// src/systems/movingPlatforms.js
// Simple ping-pong moving platforms that carry the player.

export function createMovingPlatforms(scene, movingPlatforms = []) {
  const group = scene.physics.add.group({
    allowGravity: false,
    immovable: true,
  });

  for (const mp of movingPlatforms) {
    const {
      x,
      y,
      w,
      h,
      dx = 160, // travel distance in x (total range)
      dy = 0,   // travel distance in y (total range)
      speed = 70, // pixels/sec
      color = 0x60a5fa,
    } = mp;

    const rect = scene.add.rectangle(x, y, w, h, color).setAlpha(0.9);
    scene.physics.add.existing(rect);

    // Arcade body config
    rect.body.setImmovable(true);
    rect.body.setAllowGravity(false);
    rect.body.setFriction(1, 0);

    // Store motion config + state
    rect.setData("startX", x);
    rect.setData("startY", y);
    rect.setData("dx", dx);
    rect.setData("dy", dy);
    rect.setData("speed", speed);
    rect.setData("dir", 1); // 1 or -1
    rect.setData("t", 0);   // 0..1 progress along path

    // Track last position for carry calculations
    rect.setData("lastX", x);
    rect.setData("lastY", y);

    group.add(rect);
  }

  return group;
}

export function updateMovingPlatforms(scene, group, dtSeconds) {
  if (!group) return;

  group.children.iterate((plat) => {
    if (!plat?.body) return;

    const startX = plat.getData("startX");
    const startY = plat.getData("startY");
    const dx = plat.getData("dx");
    const dy = plat.getData("dy");
    const speed = plat.getData("speed");

    // Save last position before we move
    plat.setData("lastX", plat.x);
    plat.setData("lastY", plat.y);

    // How long for a full one-way trip? distance / speed
    const distance = Math.hypot(dx, dy);
    const oneWayTime = distance > 0 ? distance / Math.max(1, speed) : 1;

    // Advance progress t, ping-pong between 0 and 1
    let t = plat.getData("t");
    let dir = plat.getData("dir");

    t += (dtSeconds / oneWayTime) * dir;

    if (t >= 1) {
      t = 1;
      dir = -1;
    } else if (t <= 0) {
      t = 0;
      dir = 1;
    }

    plat.setData("t", t);
    plat.setData("dir", dir);

    // Position along the line
    plat.x = startX + dx * t;
    plat.y = startY + dy * t;

    // IMPORTANT: tell Arcade body it moved
    plat.body.updateFromGameObject();
  });
}

// Carry player with platform if standing on it
export function carryPlayerWithPlatforms(scene, player, group) {
  if (!player?.body || !group) return;

  group.children.iterate((plat) => {
    if (!plat?.body) return;

    const dx = plat.x - plat.getData("lastX");
    const dy = plat.y - plat.getData("lastY");

    if (dx === 0 && dy === 0) return;

    // Only carry if player is standing on top of the platform
    const playerOnTop =
      player.body.touching.down && plat.body.touching.up;

    if (playerOnTop) {
      player.x += dx;
      player.body.updateFromGameObject();

    }
  });
}
