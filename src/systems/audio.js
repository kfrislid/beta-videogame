// src/systems/audio.js
// Procedural sound effects using WebAudio (no asset files).
// Usage:
//   import { ensureSfx } from "../systems/audio.js";
//   ensureSfx(this);
//   this.sfx.unlock(); // call on first user input (click/keydown)
//   this.sfx.coin(), this.sfx.jump(), etc.

export function ensureSfx(scene) {
  // Keep one global SFX instance across scenes
  if (!window.__SFX__) window.__SFX__ = createSfx();
  scene.sfx = window.__SFX__;
  return scene.sfx;
}

function createSfx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    // No WebAudio support: return safe no-ops
    return makeNoopSfx();
  }

  const ctx = new AudioCtx();

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  let muted = false;

  function unlock() {
    // Browsers start AudioContext "suspended" until a user gesture.
    if (ctx.state === "suspended") ctx.resume();
  }

  function setMuted(v) {
    muted = !!v;
    master.gain.value = muted ? 0 : 0.55;
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  // --- Core building block: a short tone with an envelope ---
  function tone({
    type = "sine",
    f0 = 440,
    f1 = null,
    duration = 0.12,
    gain = 0.5,
    attack = 0.005,
    release = 0.08,
    when = ctx.currentTime,
  }) {
    if (muted) return;

    const osc = ctx.createOscillator();
    osc.type = type;

    const g = ctx.createGain();
    g.gain.value = 0;

    osc.connect(g);
    g.connect(master);

    osc.frequency.setValueAtTime(f0, when);
    if (f1 != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, f1), when + duration);
    }

    // ADSR-ish
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration + release);

    osc.start(when);
    osc.stop(when + duration + release + 0.02);
  }

  function noiseHit({ duration = 0.08, gain = 0.35, when = ctx.currentTime } = {}) {
    if (muted) return;

    const bufferSize = Math.floor(ctx.sampleRate * (duration + 0.05));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.85;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 600;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(master);

    src.start(when);
    src.stop(when + duration + 0.02);
  }

  // --- Public SFX API ---
  return {
    unlock,
    isMuted: () => muted,
    toggleMute,

    uiHover() {
      unlock();
      tone({ type: "sine", f0: 820, f1: 980, duration: 0.06, gain: 0.18, release: 0.04 });
    },
    uiClick() {
      unlock();
      tone({ type: "square", f0: 520, f1: 380, duration: 0.08, gain: 0.22, release: 0.05 });
    },

    jump() {
      unlock();
      tone({ type: "triangle", f0: 420, f1: 780, duration: 0.10, gain: 0.28, release: 0.07 });
    },
    coin() {
      unlock();
      const t = ctx.currentTime;
      tone({ type: "sine", f0: 880, f1: 1200, duration: 0.06, gain: 0.22, release: 0.05, when: t });
      tone({ type: "sine", f0: 1200, f1: 1500, duration: 0.05, gain: 0.18, release: 0.04, when: t + 0.06 });
    },
    checkpoint() {
      unlock();
      const t = ctx.currentTime;
      tone({ type: "sine", f0: 660, f1: 900, duration: 0.08, gain: 0.22, when: t });
      tone({ type: "sine", f0: 900, f1: 1100, duration: 0.08, gain: 0.20, when: t + 0.08 });
    },
    stomp() {
      unlock();
      tone({ type: "square", f0: 220, f1: 110, duration: 0.08, gain: 0.28, release: 0.06 });
    },
    hurt() {
      unlock();
      noiseHit({ duration: 0.09, gain: 0.22 });
      tone({ type: "sawtooth", f0: 260, f1: 120, duration: 0.14, gain: 0.18, release: 0.08 });
    },
    win() {
      unlock();
      const t = ctx.currentTime;
      tone({ type: "sine", f0: 523.25, f1: 659.25, duration: 0.10, gain: 0.22, when: t });
      tone({ type: "sine", f0: 659.25, f1: 783.99, duration: 0.12, gain: 0.22, when: t + 0.11 });
      tone({ type: "sine", f0: 783.99, f1: 1046.5, duration: 0.14, gain: 0.22, when: t + 0.24 });
    },
    lose() {
      unlock();
      const t = ctx.currentTime;
      tone({ type: "triangle", f0: 392, f1: 196, duration: 0.16, gain: 0.20, when: t });
      tone({ type: "triangle", f0: 196, f1: 110, duration: 0.18, gain: 0.18, when: t + 0.17 });
    },
  };
}

function makeNoopSfx() {
  const noop = () => {};
  return {
    unlock: noop,
    isMuted: () => false,
    toggleMute: () => false,
    uiHover: noop,
    uiClick: noop,
    jump: noop,
    coin: noop,
    checkpoint: noop,
    stomp: noop,
    hurt: noop,
    win: noop,
    lose: noop,
  };
}
