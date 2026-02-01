const Phaser = window.Phaser;

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor("#0f172a");

    // Title
    this.add
      .text(w / 2, h / 2 - 90, "Circle Platformer", {
        fontSize: "56px",
        color: "#ffffff",
        fontStyle: "800",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(w / 2, h / 2 - 40, "Coins • Enemies • Checkpoints • Levels", {
        fontSize: "18px",
        color: "#cbd5e1",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setOrigin(0.5);

    // Start button
    const btn = this.add
      .rectangle(w / 2, h / 2 + 40, 280, 64, 0x2563eb, 1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(w / 2, h / 2 + 40, "Start", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "800",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      })
      .setOrigin(0.5);

    // Hover effects
    btn.on("pointerover", () => btn.setFillStyle(0x1d4ed8, 1));
    btn.on("pointerout", () => btn.setFillStyle(0x2563eb, 1));

    // Click -> start game
    btn.on("pointerdown", () => {
      this.scene.start("GameScene"); // switches to your actual game
    });

    // Optional: press Enter / Space to start
    const startKeys = this.input.keyboard.addKeys({
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.input.keyboard.on("keydown", () => {
      if (startKeys.ENTER.isDown || startKeys.SPACE.isDown) {
        this.scene.start("GameScene");
      }
    });
  }
}
