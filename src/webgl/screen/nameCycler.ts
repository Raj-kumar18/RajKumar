import * as THREE from "three";

/**
 * "Raj Kumar" transliterated into 15 scripts.
 */
export type NameEntry = {
  /** English name of the language, shown as a label */
  lang: string;
  /** The language's own name for itself, in its own script */
  native: string;
  /** "Raj Kumar" transliterated into that script */
  text: string;
};

export const RAJ_KUMAR_NAMES: NameEntry[] = [
  { lang: "English", native: "English", text: "Raj Kumar" },
  { lang: "Hindi", native: "हिन्दी", text: "राज कुमार" },
  { lang: "Bengali", native: "বাংলা", text: "রাজ কুমার" },
  { lang: "Tamil", native: "தமிழ்", text: "ராஜ் குமார்" },
  { lang: "Telugu", native: "తెలుగు", text: "రాజ్ కుమార్" },
  { lang: "Gujarati", native: "ગુજરાતી", text: "રાજ કુમાર" },
  { lang: "Punjabi", native: "ਪੰਜਾਬੀ", text: "ਰਾਜ ਕੁਮਾਰ" },
  { lang: "Thai", native: "ภาษาไทย", text: "ราช กุมาร" },
  { lang: "Russian", native: "Русский", text: "Радж Кумар" },
  { lang: "Arabic", native: "العربية", text: "راج كومار" },
  { lang: "Hebrew", native: "עברית", text: "ראג' קומאר" },
  { lang: "Greek", native: "Ελληνικά", text: "Ράζ Κουμάρ" },
  { lang: "Chinese", native: "中文", text: "拉杰·库玛尔" },
  { lang: "Japanese", native: "日本語", text: "ラージ・クマール" },
  { lang: "Korean", native: "한국어", text: "라지 쿠마르" },
];

export type NameCyclerOptions = {
  /** Canvas resolution — keep square-ish unless your screen UV needs otherwise */
  width?: number;
  height?: number;
  /** Seconds the name stays fully visible before transitioning out */
  holdDuration?: number;
  /** Seconds for the wipe-in / wipe-out transition */
  transitionDuration?: number;
  /** Font used for the rendered text. Falls back automatically per-script. */
  fontFamily?: string;
  /** Amber phosphor color for the main text/glow */
  ambientColor?: string;
  /** Brand magenta used for the label + glitch streaks */
  accentColor?: string;
  /** Background color of the "screen" */
  backgroundColor?: string;
};

type Phase = "in" | "hold" | "out";

const DEFAULTS: Required<NameCyclerOptions> = {
  width: 1024,
  height: 1024,
  holdDuration: 1.6,
  transitionDuration: 0.45,
  fontFamily: "monospace",
  ambientColor: "#ffb400",
  accentColor: "#ff2bd6",
  backgroundColor: "#0b0a08",
};

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}
function easeInQuad(t: number) {
  return t * t;
}

/**
 * Drives a THREE.CanvasTexture that cycles "Raj Kumar" through multiple
 * scripts with a CRT wipe + glitch transition. Assign `.texture` to a
 * mesh's material map and call `.update(delta)` from your render loop.
 */
export class NameCycler {
  readonly texture: THREE.CanvasTexture;

  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entries: NameEntry[];
  private opts: Required<NameCyclerOptions>;

  private index = 0;
  private phase: Phase = "in";
  private phaseElapsed = 0;

  constructor(entries: NameEntry[] = RAJ_KUMAR_NAMES, options: NameCyclerOptions = {}) {
    if (entries.length === 0) throw new Error("NameCycler: entries array is empty");
    this.entries = entries;
    this.opts = { ...DEFAULTS, ...options };

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.opts.width;
    this.canvas.height = this.opts.height;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("NameCycler: could not acquire 2D canvas context");
    this.ctx = ctx;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.encoding = THREE.sRGBEncoding;

    this.draw();
  }

  /** Call once per frame with delta time in seconds (e.g. clock.getDelta()) */
  update(delta: number) {
    this.phaseElapsed += delta;
    const { transitionDuration, holdDuration } = this.opts;

    if (this.phase === "in" && this.phaseElapsed >= transitionDuration) {
      this.phase = "hold";
      this.phaseElapsed = 0;
    } else if (this.phase === "hold" && this.phaseElapsed >= holdDuration) {
      this.phase = "out";
      this.phaseElapsed = 0;
    } else if (this.phase === "out" && this.phaseElapsed >= transitionDuration) {
      this.index = (this.index + 1) % this.entries.length;
      this.phase = "in";
      this.phaseElapsed = 0;
    }

    this.draw();
    this.texture.needsUpdate = true;
  }

  /** Jump straight to a specific language by index, no transition */
  setIndex(i: number) {
    this.index = ((i % this.entries.length) + this.entries.length) % this.entries.length;
    this.phase = "hold";
    this.phaseElapsed = 0;
    this.draw();
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }

  private draw() {
    const { ctx, canvas, opts } = this;
    const { width, height } = canvas;
    const entry = this.entries[this.index];

    const dur = this.phase === "hold" ? opts.holdDuration : opts.transitionDuration;
    const t = dur > 0 ? Math.min(this.phaseElapsed / dur, 1) : 1;

    // background
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // faint scanlines
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = opts.ambientColor;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;

    let revealWidth = width;
    let alpha = 1;
    let glitchOffset = 0;

    if (this.phase === "in") {
      revealWidth = width * easeOutQuad(t);
      alpha = t;
      glitchOffset = (1 - t) * 14 * (Math.random() - 0.5);
    } else if (this.phase === "out") {
      revealWidth = width * (1 - easeInQuad(t));
      alpha = 1 - t;
      glitchOffset = t * 14 * (Math.random() - 0.5);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(revealWidth, 0), height);
    ctx.clip();

    // label: native script name + English language name
    ctx.globalAlpha = alpha;
    ctx.fillStyle = opts.accentColor;
    ctx.textAlign = "center";
    ctx.font = `${Math.floor(width * 0.026)}px ${opts.fontFamily}`;
    ctx.fillText(
      `${entry.native} / ${entry.lang.toUpperCase()}`,
      width / 2 + glitchOffset,
      height * 0.36
    );

    // main name, glowing amber
    ctx.fillStyle = opts.ambientColor;
    ctx.shadowColor = opts.ambientColor;
    ctx.shadowBlur = width * 0.022;
    ctx.font = `bold ${Math.floor(width * 0.09)}px ${opts.fontFamily}`;
    ctx.fillText(entry.text, width / 2 + glitchOffset, height * 0.52);
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.globalAlpha = 1;

    // chromatic glitch streaks during transitions only
    if (this.phase !== "hold") {
      const intensity = 1 - Math.abs(0.5 - t) * 2; // peaks mid-transition
      ctx.globalAlpha = 0.5 * intensity;
      ctx.fillStyle = opts.accentColor;
      for (let i = 0; i < 3; i++) {
        const y = Math.random() * height;
        ctx.fillRect(0, y, width, 2);
      }
      ctx.globalAlpha = 1;
    }
  }
}
