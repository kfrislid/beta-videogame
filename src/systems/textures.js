const Phaser = window.Phaser;

export function ensureTextures(scene) {
  makePlayerTexture(scene);
  makeCoinTexture(scene);
  makeEnemyTexture(scene);
  makeFlagTexture(scene);
  makeCheckpointTextures(scene);
}

function makePlayerTexture(scene) {
  if (scene.textures.exists("player")) return;

  const radius = 18;
  const size = radius * 2;

  const g = scene.add.graphics();
  g.lineStyle(4, 0x0f172a, 1);
  g.strokeCircle(size / 2, size / 2, radius - 2);

  g.fillStyle(0x4fe3c1, 1);
  g.fillCircle(size / 2, size / 2, radius - 4);

  g.generateTexture("player", size, size);
  g.destroy();
}

function makeCoinTexture(scene) {
  if (scene.textures.exists("coin")) return;

  const size = 24;
  const g = scene.add.graphics();

  g.fillStyle(0xfbbf24, 1);
  g.fillCircle(size / 2, size / 2, size / 2 - 2);

  g.fillStyle(0xfde68a, 1);
  g.fillCircle(size / 2 - 3, size / 2 - 3, size / 2 - 8);

  g.fillStyle(0xf59e0b, 1);
  g.fillCircle(size / 2 + 2, size / 2 + 2, 3);

  g.generateTexture("coin", size, size);
  g.destroy();
}

function makeEnemyTexture(scene) {
  if (scene.textures.exists("enemy")) return;

  const s = 34;
  const g = scene.add.graphics();

  g.fillStyle(0xef4444, 1);
  g.fillRoundedRect(2, 6, s - 4, s - 10, 8);

  g.fillStyle(0x111827, 1);
  g.fillCircle(s / 2 - 6, s / 2, 3);
  g.fillCircle(s / 2 + 6, s / 2, 3);

  g.fillStyle(0xfca5a5, 1);
  g.fillCircle(s / 2 - 9, s / 2 - 6, 3);

  g.generateTexture("enemy", s, s);
  g.destroy();
}

function makeFlagTexture(scene) {
  if (scene.textures.exists("flag")) return;

  const w = 18;
  const h = 120;
  const g = scene.add.graphics();

  g.fillStyle(0xe5e7eb, 1);
  g.fillRoundedRect(w / 2 - 3, 0, 6, h, 3);

  g.fillStyle(0x22c55e, 1);
  g.fillTriangle(w / 2 + 3, 12, w / 2 + 3, 44, w - 2, 28);

  g.fillStyle(0x16a34a, 1);
  g.fillTriangle(w / 2 + 6, 16, w / 2 + 6, 40, w - 6, 28);

  g.generateTexture("flag", w, h);
  g.destroy();
}

function makeCheckpointTextures(scene) {
  if (scene.textures.exists("checkpoint") && scene.textures.exists("checkpoint_on")) return;

  const w = 18;
  const h = 110;

  // Inactive (gray)
  {
    const g = scene.add.graphics();
    g.fillStyle(0xcbd5e1, 1);
    g.fillRoundedRect(w / 2 - 3, 0, 6, h, 3);

    g.fillStyle(0x94a3b8, 1);
    g.fillTriangle(w / 2 + 3, 14, w / 2 + 3, 46, w - 2, 30);

    g.generateTexture("checkpoint", w, h);
    g.destroy();
  }

  // Active (yellow)
  {
    const g = scene.add.graphics();
    g.fillStyle(0xe5e7eb, 1);
    g.fillRoundedRect(w / 2 - 3, 0, 6, h, 3);

    g.fillStyle(0xfbbf24, 1);
    g.fillTriangle(w / 2 + 3, 14, w / 2 + 3, 46, w - 2, 30);

    g.fillStyle(0xfde68a, 1);
    g.fillTriangle(w / 2 + 6, 18, w / 2 + 6, 42, w - 6, 30);

    g.generateTexture("checkpoint_on", w, h);
    g.destroy();
  }
}
