export function createUI(scene, { onTryAgain }) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const scoreText = scene.add.text(12, 12, "Score: 0", {
    fontSize: "18px",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  }).setScrollFactor(0);

  const livesText = scene.add.text(12, 36, "Lives: 3", {
    fontSize: "18px",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  }).setScrollFactor(0);

  const backdrop = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x000000, 0.55)
    .setScrollFactor(0)
    .setVisible(false);

  const title = scene.add.text(w / 2, h / 2 - 40, "", {
    fontSize: "52px",
    color: "#ffffff",
    fontStyle: "800",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

  const button = scene.add
    .rectangle(w / 2, h / 2 + 55, 260, 56, 0x2563eb, 1)
    .setScrollFactor(0)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const buttonText = scene.add.text(w / 2, h / 2 + 55, "Try Again", {
    fontSize: "22px",
    color: "#ffffff",
    fontStyle: "700",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

  button.on("pointerover", () => {
    if (!button.visible) return;
    button.setFillStyle(0x1d4ed8, 1);
  });
  button.on("pointerout", () => {
    if (!button.visible) return;
    button.setFillStyle(0x2563eb, 1);
  });
  button.on("pointerdown", () => {
    if (!button.visible) return;
    onTryAgain?.();
  });

  return {
    setScore: (n) => scoreText.setText(`Score: ${n}`),
    setLives: (n) => livesText.setText(`Lives: ${n}`),

    showOverlay: ({ title: t, showButton }) => {
      backdrop.setVisible(true);
      title.setText(t);
      title.setVisible(true);

      button.setVisible(!!showButton);
      buttonText.setVisible(!!showButton);
    },

    hideOverlay: () => {
      backdrop.setVisible(false);
      title.setVisible(false);
      button.setVisible(false);
      buttonText.setVisible(false);
    },
  };
}
