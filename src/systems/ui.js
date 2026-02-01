export function createUI(scene, { onTryAgain, onHome }) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const scoreText = scene.add
    .text(12, 12, "Score: 0", {
      fontSize: "18px",
      color: "#e5e7eb",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setScrollFactor(0);

  const livesText = scene.add
    .text(12, 36, "Lives: 3", {
      fontSize: "18px",
      color: "#e5e7eb",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setScrollFactor(0);

  // ---- Toast (top-center) ----
  const toastBg = scene.add
    .rectangle(w / 2, 80, 320, 46, 0x111827, 0.85)
    .setScrollFactor(0)
    .setVisible(false);

  const toastText = scene.add
    .text(w / 2, 80, "Checkpoint saved!", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "700",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  let toastTween = null;

  function showToast(message, durationMs = 1100) {
    if (toastTween) {
      toastTween.stop();
      toastTween = null;
    }

    toastText.setText(message);

    toastBg.setAlpha(0);
    toastText.setAlpha(0);
    toastBg.setVisible(true);
    toastText.setVisible(true);

    scene.tweens.add({
      targets: [toastBg, toastText],
      alpha: 1,
      duration: 140,
      onComplete: () => {
        toastTween = scene.tweens.add({
          targets: [toastBg, toastText],
          alpha: 0,
          delay: Math.max(0, durationMs),
          duration: 260,
          onComplete: () => {
            toastBg.setVisible(false);
            toastText.setVisible(false);
            toastTween = null;
          },
        });
      },
    });
  }

  // ---- Overlay ----
  const backdrop = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x000000, 0.55)
    .setScrollFactor(0)
    .setVisible(false);

  const title = scene.add
    .text(w / 2, h / 2 - 90, "", {
      fontSize: "52px",
      color: "#ffffff",
      fontStyle: "800",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Primary button: Try Again (blue)
  const tryBtn = scene.add
    .rectangle(w / 2, h / 2 + 10, 260, 56, 0x2563eb, 1)
    .setScrollFactor(0)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const tryBtnText = scene.add
    .text(w / 2, h / 2 + 10, "Try Again", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "700",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Secondary button: Home (dark)
  const homeBtn = scene.add
    .rectangle(w / 2, h / 2 + 80, 260, 56, 0x111827, 1)
    .setScrollFactor(0)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const homeBtnText = scene.add
    .text(w / 2, h / 2 + 80, "Back to Home", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "700",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Hover effects
  tryBtn.on("pointerover", () => {
    if (!tryBtn.visible) return;
    tryBtn.setFillStyle(0x1d4ed8, 1);
  });
  tryBtn.on("pointerout", () => {
    if (!tryBtn.visible) return;
    tryBtn.setFillStyle(0x2563eb, 1);
  });

  homeBtn.on("pointerover", () => {
    if (!homeBtn.visible) return;
    homeBtn.setFillStyle(0x0b1220, 1);
  });
  homeBtn.on("pointerout", () => {
    if (!homeBtn.visible) return;
    homeBtn.setFillStyle(0x111827, 1);
  });

  // Click handlers
  tryBtn.on("pointerdown", () => {
    if (!tryBtn.visible) return;
    onTryAgain?.();
  });

  homeBtn.on("pointerdown", () => {
    if (!homeBtn.visible) return;
    onHome?.();
  });

  return {
    setScore: (n) => scoreText.setText(`Score: ${n}`),
    setLives: (n) => livesText.setText(`Lives: ${n}`),
    toast: (message, durationMs) => showToast(message, durationMs),

    showOverlay: ({ title: t, showTryAgain, showHome }) => {
      backdrop.setVisible(true);
      title.setText(t);
      title.setVisible(true);

      tryBtn.setVisible(!!showTryAgain);
      tryBtnText.setVisible(!!showTryAgain);

      homeBtn.setVisible(!!showHome);
      homeBtnText.setVisible(!!showHome);
    },

    hideOverlay: () => {
      backdrop.setVisible(false);
      title.setVisible(false);

      tryBtn.setVisible(false);
      tryBtnText.setVisible(false);

      homeBtn.setVisible(false);
      homeBtnText.setVisible(false);
    },
  };
}
