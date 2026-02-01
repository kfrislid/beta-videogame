export function createCheckpoints(scene, checkpoints) {
  const group = scene.physics.add.staticGroup();

  for (const cp of checkpoints) {
    const flag = group.create(cp.x, cp.y, "checkpoint");
    flag.setData("spawnX", cp.x);
    flag.setData("spawnY", cp.y - 40); // respawn a little above the flag
    flag.setData("active", false);
    flag.refreshBody();
  }

  return group;
}

export function setCheckpointActive(checkpointsGroup, checkpointSprite) {
  // Turn off all
  checkpointsGroup.children.iterate((cp) => {
    if (!cp) return;
    cp.setData("active", false);
    cp.setTexture("checkpoint");
  });

  // Turn on selected
  checkpointSprite.setData("active", true);
  checkpointSprite.setTexture("checkpoint_on");
}

export function resetCheckpoints(checkpointsGroup) {
  checkpointsGroup.children.iterate((cp) => {
    if (!cp) return;
    cp.setData("active", false);
    cp.setTexture("checkpoint");
  });
}

export function getActiveCheckpointSpawn(checkpointsGroup) {
  let found = null;

  checkpointsGroup.children.iterate((cp) => {
    if (!cp) return;
    if (cp.getData("active")) {
      found = { x: cp.getData("spawnX"), y: cp.getData("spawnY") };
    }
  });

  return found;
}
