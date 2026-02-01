export function createUI(scene, { onTryAgain, onHome, onNextLevel }) {
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
    .text(w / 2, h / 2 - 110, "", {
      fontSize: "52px",
      color: "#ffffff",
      fontStyle: "800",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Primary button (blue) - dynamic label/action
  const primaryBtn = scene.add
    .rectangle(w / 2, h / 2 + 0, 280, 56, 0x2563eb, 1)
    .setScrollFactor(0)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const primaryBtnText = scene.add
    .text(w / 2, h / 2 + 0, "Primary", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "800",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Secondary button: Home (dark)
  const homeBtn = scene.add
    .rectangle(w / 2, h / 2 + 72, 280, 56, 0x111827, 1)
    .setScrollFactor(0)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const homeBtnText = scene.add
    .text(w / 2, h / 2 + 72, "Back to Home", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "700",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);

  // Hover effects
  primaryBtn.on("pointerover", () => {
    if (!primaryBtn.visible) return;
    primaryBtn.setFillStyle(0x1d4ed8, 1);
  });
  primaryBtn.on("pointerout", () => {
    if (!primaryBtn.visible) return;
    primaryBtn.setFillStyle(0x2563eb, 1);
  });

  homeBtn.on("pointerover", () => {
    if (!homeBtn.visible) return;
    homeBtn.setFillStyle(0x0b1220, 1);
  });
  homeBtn.on("pointerout", () => {
    if (!homeBtn.visible) return;
    homeBtn.setFillStyle(0x111827, 1);
  });

  // Primary click routes based on mode
  let primaryAction = null;

  primaryBtn.on("pointerdown", () => {
    if (!primaryBtn.visible) return;
    primaryAction?.();
  });

  homeBtn.on("pointerdown", () => {
    if (!homeBtn.visible) return;
    onHome?.();
  });

  function showPrimary(label, action) {
    primaryBtnText.setText(label);
    primaryAction = action;

    primaryBtn.setVisible(true);
    primaryBtnText.setVisible(true);
  }

  function hidePrimary() {
    primaryAction = null;
    primaryBtn.setVisible(false);
    primaryBtnText.setVisible(false);
  }

  return {
    setScore: (n) => scoreText.setText(`Score: ${n}`),
    setLives: (n) => livesText.setText(`Lives: ${n}`),
    toast: (message, durationMs) => showToast(message, durationMs),

    // overlayMode:
    // - "lose" => primary = Try Again
    // - "win"  => primary = Next Level
    showOverlay: ({ title: t, overlayMode, showHome }) => {
      backdrop.setVisible(true);
      title.setText(t);
      title.setVisible(true);

      if (overlayMode === "lose") {
        showPrimary("Try Again", () => onTryAgain?.());
      } else if (overlayMode === "win") {
        showPrimary("Next Level", () => onNextLevel?.());
      } else {
        hidePrimary();
      }

      homeBtn.setVisible(!!showHome);
      homeBtnText.setVisible(!!showHome);
    },

    hideOverlay: () => {
      backdrop.setVisible(false);
      title.setVisible(false);
      hidePrimary();
      homeBtn.setVisible(false);
      homeBtnText.setVisible(false);
    },
  };
}
