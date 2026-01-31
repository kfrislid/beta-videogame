export function createGoal(scene, goal) {
  const g = scene.physics.add.staticSprite(goal.x, goal.y, "flag");
  g.refreshBody();
  return g;
}
