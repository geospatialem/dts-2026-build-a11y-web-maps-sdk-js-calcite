import { setupSheetInteractions } from "../shared/shell-navigation.js";

const mapEl = document.querySelector("arcgis-map");

const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");

const motionPreferenceStatusEl = document.getElementById("motion-preference-status");
const playAnimationsButtonEl = document.getElementById("play-animations");
const pauseAnimationsButtonEl = document.getElementById("pause-animations");

const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

let animationEnabled = false;

await mapEl?.viewOnReady();
setupSheetInteractions({ navigationEl, panelEl, sheetEl });

playAnimationsButtonEl?.addEventListener("click", handlePlayAnimations);
pauseAnimationsButtonEl?.addEventListener("click", handlePauseAnimations);
reduceMotionMedia.addEventListener("change", handleMotionPreferenceChange);

initializeMotionControls();

// TODO wait for API issue then handle popup focus state

function initializeMotionControls() {
  updateMotionPreferenceLabel();
  setAnimationEnabled(!reduceMotionMedia.matches);
  updateAnimationButtons();
}

function handleMotionPreferenceChange() {
  updateMotionPreferenceLabel();
  if (reduceMotionMedia.matches) {
    setAnimationEnabled(false);
    updateAnimationButtons();
  }
}

function updateMotionPreferenceLabel() {
  if (!motionPreferenceStatusEl) return;
  motionPreferenceStatusEl.textContent = `Prefers reduced motion: ${reduceMotionMedia.matches ? "set" : "not set"}`;
}

function handlePlayAnimations() {
  setAnimationEnabled(true);
  updateAnimationButtons();
}

function handlePauseAnimations() {
  setAnimationEnabled(false);
  updateAnimationButtons();
}

function updateAnimationButtons() {
  if (playAnimationsButtonEl) {
    playAnimationsButtonEl.disabled = animationEnabled;
  }

  if (pauseAnimationsButtonEl) {
    pauseAnimationsButtonEl.disabled = !animationEnabled;
  }
}

function setAnimationEnabled(enabled) {
  const view = mapEl?.view;
  if (!view) return;

  if ("animationsEnabled" in view) {
    view.animationsEnabled = enabled;
    animationEnabled = enabled;
    return;
  }

  if ("animationsDisabled" in view) {
    view.animationsDisabled = !enabled;
    animationEnabled = enabled;
    return;
  }

  animationEnabled = enabled;
}