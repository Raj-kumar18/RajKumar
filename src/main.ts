import "./main.css";
import WebGL from "./webgl";
import Lenis from "lenis";

const RAJ_KUMAR_NAMES = [
  "Raj Kumar",
  "राज कुमार",
  "রাজ কুমার",
  "ராஜ் குமார்",
  "రాజ్ కుమార్",
  "રાજ કુમાર",
  "ਰਾਜ ਕੁਮਾਰ",
  "ราช กุมาร",
  "Радж Кумар",
  "راج كومار",
  "ראג' קומאר",
  "Ράζ Κουμάρ",
  "拉杰·库玛尔",
  "ラージ・クマール",
  "라지 쿠마르"
];

let currentLangIndex = 0;
const textElement = document.getElementById("loader-languages-text");
let textCycleInterval: number | undefined;

if (textElement) {
  textElement.textContent = RAJ_KUMAR_NAMES[0];
  textCycleInterval = window.setInterval(() => {
    textElement.style.opacity = "0";
    setTimeout(() => {
      currentLangIndex = (currentLangIndex + 1) % RAJ_KUMAR_NAMES.length;
      textElement.textContent = RAJ_KUMAR_NAMES[currentLangIndex];
      textElement.style.opacity = "1";
    }, 150);
  }, 400);
}

// Bottom-left Loading Percentage Observer
const progressEl = document.getElementById("loading-bar-progress");
const percentEl = document.getElementById("loader-percentage");
let progressObserver: MutationObserver | undefined;

if (progressEl && percentEl) {
  progressObserver = new MutationObserver(() => {
    const transform = progressEl.style.transform;
    const match = transform.match(/scaleX\(([^)]+)\)/);
    if (match) {
      const progress = parseFloat(match[1]);
      const percent = Math.floor(progress * 100);
      percentEl.textContent = `${percent}%`;
    }
  });
  progressObserver.observe(progressEl, { attributes: true, attributeFilter: ["style"] });
}

// Initialize WebGL
WebGL(() => {
  if (textCycleInterval !== undefined) {
    clearInterval(textCycleInterval);
  }
  if (progressObserver !== undefined) {
    progressObserver.disconnect();
  }

  const loadingOverlay = document.getElementById("loading");
  if (loadingOverlay) {
    loadingOverlay.style.opacity = "0";
    loadingOverlay.style.transform = "translateY(-100%)";
  }

  // 🔑 FIX: classList.add("loaded") + the "site-loaded" event used to fire
  // IMMEDIATELY right here, in the same tick as the lines above. That event
  // triggers initScrollAnimations() in index.html, which runs
  // ScrollTrigger.refresh() and creates 48+ scroll triggers — a heavy,
  // synchronous main-thread operation. That work was blocking the main
  // thread WHILE the overlay was trying to fade/translate out, eating the
  // transition's frame budget — so instead of a smooth slide, it looked
  // like an instant snap to the final state.
  //
  // Fix: delay both classList.add("loaded") and the "site-loaded" dispatch
  // until AFTER the overlay's exit transition has actually finished
  // (matched to the same 1200ms timeout that hides the overlay). This way
  // nothing heavy competes with the fade-out animation on the main thread.
  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
    document.documentElement.classList.add("loaded");
    window.dispatchEvent(new Event("site-loaded"));
  }, 1200); // EDITABLE: keep this >= your CSS transition duration for #loading
});

// Setup Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
  touchMultiplier: 2,
});

// Expose Lenis globally so other scripts can access it
(window as any).lenis = lenis;

// Connect Lenis to ScrollTrigger if GSAP & ScrollTrigger are loaded
if ((window as any).gsap && (window as any).ScrollTrigger) {
  const gsap = (window as any).gsap;
  const ScrollTrigger = (window as any).ScrollTrigger;

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time: number) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
} else {
  // Fallback to standard RAF if GSAP isn't loaded yet
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Intercept clicks on anchor tags for smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      lenis.scrollTo(targetElement as HTMLElement);
    }
  });
});

const root = document.documentElement;

function onScroll() {
  if (window.scrollY > 10) root.dataset.scroll = "true";
  else root.dataset.scroll = "false";
}
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Live retro system monitor updates
const startTime = Date.now();

function updateSystemMonitor() {
  const sysTimeEl = document.getElementById("sys-time");
  const sysUptimeEl = document.getElementById("sys-uptime");
  const sysRamEl = document.getElementById("sys-ram");
  const sysCpuEl = document.getElementById("sys-cpu");

  // 1. Time (IST Patna time)
  if (sysTimeEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    sysTimeEl.textContent = `${timeStr} IST`;
  }

  // 2. Uptime
  if (sysUptimeEl) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    sysUptimeEl.textContent = `${elapsedSeconds}s`;
  }

  // 3. RAM (simulated fluctuation)
  if (sysRamEl) {
    const baseFree = 28416; // out of 32768
    const fluctuation = Math.floor(Math.sin(Date.now() / 3000) * 128) + Math.floor(Math.random() * 32);
    const freeRam = baseFree + fluctuation;
    sysRamEl.textContent = `${freeRam} / 32768 BYTES`;
  }

  // 4. CPU LOAD
  if (sysCpuEl) {
    const baseCpu = 2.4;
    const noise = Math.sin(Date.now() / 1500) * 1.5 + Math.random() * 0.8;
    const cpuLoad = Math.max(0.2, (baseCpu + noise)).toFixed(1);
    sysCpuEl.textContent = `${cpuLoad}%`;
  }
}

// Update monitor immediately and then every second
updateSystemMonitor();
window.setInterval(updateSystemMonitor, 1000);
