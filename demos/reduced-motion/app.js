import { setupSheetInteractions } from "../shared/shell-navigation.js";
import { mountAccessibilitySheet } from "../shared/accessibility-sheet.js";

const mapEl = document.querySelector("arcgis-map");

const navigationEl = document.getElementById("nav");
const { panelEl, sheetEl } = mountAccessibilitySheet();

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
  if (!mapEl) return;
  mapEl.animationsDisabled = !enabled;

  animationEnabled = enabled;
  return;

}