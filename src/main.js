import { GameScene } from "./scenes/GameScene.js";

const Phaser = window.Phaser;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 850 },
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
