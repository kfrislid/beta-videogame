const Phaser = window.Phaser;

export function ensureTextures(scene) {
  makePlayerTexture(scene);
  makeCoinTexture(scene);
  makeEnemyTexture(scene);
  makeFlagTexture(scene);
  makeCheckpointTextures(scene);
  makeSpikeTexture(scene);
}

function makePlayerTexture(scene) {
  // We create an animated spritesheet-like texture (player_anim) from a canvas.
  // This keeps your project "no-assets" friendly, but still enables animations.
  if (scene.textures.exists("player_anim")) return;

  const radius = 18;
  const size = radius * 2;

  // Frames: 0 idle, 1 runA, 2 runB, 3 jump, 4 fall
  const frames = 5;
  const key = "player_anim";
  const canvasKey = "__player_anim_canvas";

  // Create (or reuse) a canvas texture holding all frames side-by-side
  if (!scene.textures.exists(canvasKey)) {
    scene.textures.createCanvas(canvasKey, size * frames, size);
  }

  const tex = scene.textures.get(canvasKey);
  const canvas = tex.getSourceImage();
  const ctx = canvas.getContext("2d");

  // Helper: draw one frame into frame slot i
  const drawFrame = (i, opts) => {
    const { highlightX, highlightY, squashY = 1, streak = false, blink = false } = opts;
    const ox = i * size;

    // Clear the frame region
    ctx.clearRect(ox, 0, size, size);

    ctx.save();
    ctx.translate(ox + size / 2, size / 2);
    ctx.scale(1, squashY);

    // Outline
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // Fill
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#4fe3c1";
    ctx.fill();

    // Small highlight (moves between frames to "sell" motion)
    ctx.beginPath();
    ctx.arc(highlightX, highlightY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    // Eyes (blink on idle sometimes)
    ctx.fillStyle = "#0f172a";
    if (!blink) {
      ctx.beginPath();
      ctx.arc(-6, -2, 2.2, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(-3, -2);
      ctx.moveTo(3, -2);
      ctx.lineTo(9, -2);
      ctx.stroke();
    }

    // Optional motion streak for run frames
    if (streak) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, 10);
      ctx.lineTo(-26, 10);
      ctx.moveTo(-18, 2);
      ctx.lineTo(-24, 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  };

  // Paint frames
  drawFrame(0, { highlightX: -6, highlightY: -10, squashY: 1, blink: false }); // idle
  drawFrame(1, { highlightX: -2, highlightY: -9, squashY: 0.94, streak: true }); // run A
  drawFrame(2, { highlightX: 2, highlightY: -9, squashY: 1.02, streak: true }); // run B
  drawFrame(3, { highlightX: -6, highlightY: -12, squashY: 1.06 }); // jump
  drawFrame(4, { highlightX: 6, highlightY: -6, squashY: 0.98 }); // fall

  tex.refresh();

  // Convert the canvas into a spritesheet texture the Sprite can animate
  // IMPORTANT: only add if it doesn't exist (textures are shared across scenes)
  scene.textures.addSpriteSheet(key, canvas, {
    frameWidth: size,
    frameHeight: size,
  });
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

function makeSpikeTexture(scene) {
  if (scene.textures.exists("spike")) return;

  const w = 40;
  const h = 26;

  const g = scene.add.graphics();

  // Base plate
  g.fillStyle(0x111827, 1);
  g.fillRoundedRect(0, h - 6, w, 6, 3);

  // Spikes
  g.fillStyle(0x94a3b8, 1);
  const spikeCount = 5;
  const spikeW = w / spikeCount;

  for (let i = 0; i < spikeCount; i++) {
    const x0 = i * spikeW;
    g.fillTriangle(
      x0 + 2, h - 6,
      x0 + spikeW / 2, 2,
      x0 + spikeW - 2, h - 6
    );
  }

  // Highlight
  g.lineStyle(2, 0xe5e7eb, 0.8);
  for (let i = 0; i < spikeCount; i++) {
    const x0 = i * spikeW;
    g.lineBetween(x0 + spikeW / 2, 6, x0 + spikeW / 2, h - 8);
  }

  g.generateTexture("spike", w, h);
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
