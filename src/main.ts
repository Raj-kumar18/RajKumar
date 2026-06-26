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
    setTimeout(() => {
      loadingOverlay.style.display = "none";
    }, 600);
  }
  document.documentElement.classList.add("loaded");
  window.dispatchEvent(new Event("site-loaded"));
});

// Setup Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
  touchMultiplier: 2,
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

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
