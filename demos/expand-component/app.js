import { setupSheetInteractions } from "../shared/shell-navigation.js";
import { mountAccessibilitySheet } from "../shared/accessibility-sheet.js";

const mapEl = document.querySelector("arcgis-map");
const searchEl = document.querySelector("arcgis-search");

const navigationEl = document.getElementById("nav");
const { panelEl, sheetEl } = mountAccessibilitySheet();

// Active popup + handler references used to prevent listener duplication.
let activePopupEl = null;
let popupOpenPropertyChangeHandler = null;
let popupClosePropertyChangeHandler = null;
let popupCloseHandler = null;

await initializeApp();

async function initializeApp() {
  await mapEl?.viewOnReady();
  registerEventListeners();
}

function registerEventListeners() {
  setupSheetInteractions({ navigationEl, panelEl, sheetEl });
  searchEl?.addEventListener("arcgisSearchComplete", handleSearchComplete);
}

/**
 * Accessibility flow after a search completes:
 * 1) Wait for popup open (or focus immediately if already open).
 * 2) Move focus into popup content.
 * 3) Return focus to Search when popup closes.
 */
function handleSearchComplete() {
  const popupEl = getPopupElement();
  if (!popupEl) return;

  // Ensure each search starts with a clean listener state.
  clearPopupListeners();
  activePopupEl = popupEl;

  if (popupEl.open) {
    focusPopupElement(popupEl);
    registerPopupCloseListeners(popupEl);
    return;
  }

  popupOpenPropertyChangeHandler = (event) => {
    if (event?.detail?.name !== "open" || !popupEl.open) return;

    focusPopupElement(popupEl);
    removePopupOpenListener();
    registerPopupCloseListeners(popupEl);
  };

  popupEl.addEventListener("arcgisPropertyChange", popupOpenPropertyChangeHandler);
}

/**
 * Removes existing popup listeners before new ones are registered.
 * Prevents duplicate focus transitions after multiple searches.
 */
function clearPopupListeners() {
  removePopupOpenListener();
  removePopupCloseListeners();
  activePopupEl = null;
}

// Listen for popup close in two ways:
// - arcgisClose for direct close actions
// - open property change for programmatic close/state changes
function registerPopupCloseListeners(popupEl) {
  popupCloseHandler = () => {
    focusSearchInput();
    removePopupCloseListeners();
  };

  popupClosePropertyChangeHandler = (event) => {
    if (event?.detail?.name !== "open" || popupEl.open) return;
    focusSearchInput();
    removePopupCloseListeners();
  };

  popupEl.addEventListener("arcgisClose", popupCloseHandler);
  popupEl.addEventListener("arcgisPropertyChange", popupClosePropertyChangeHandler);
}

function removePopupOpenListener() {
  if (!activePopupEl || !popupOpenPropertyChangeHandler) return;

  activePopupEl.removeEventListener("arcgisPropertyChange", popupOpenPropertyChangeHandler);
  popupOpenPropertyChangeHandler = null;
}

function removePopupCloseListeners() {
  if (!activePopupEl) {
    popupCloseHandler = null;
    popupClosePropertyChangeHandler = null;
    return;
  }

  if (popupCloseHandler) {
    activePopupEl.removeEventListener("arcgisClose", popupCloseHandler);
  }

  if (popupClosePropertyChangeHandler) {
    activePopupEl.removeEventListener("arcgisPropertyChange", popupClosePropertyChangeHandler);
  }

  popupCloseHandler = null;
  popupClosePropertyChangeHandler = null;
}

// Returns the popup component associated with the map component.
function getPopupElement() {
  return mapEl?.popupElement ?? null;
}

function focusPopupElement(popupEl) {
  if (!popupEl) return;
  popupEl?.setFocus();
}

function focusSearchInput() {
  if (!searchEl) return;
  searchEl.setFocus();
}