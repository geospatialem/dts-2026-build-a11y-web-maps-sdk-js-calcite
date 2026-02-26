import { setupSheetInteractions } from "../shared/shell-navigation.js";

const mapEl = document.querySelector("arcgis-map");
const searchEl = document.querySelector("arcgis-search");

const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");

let activePopupEl = null;
let popupOpenPropertyChangeHandler = null;
let popupClosePropertyChangeHandler = null;
let popupCloseHandler = null;

await mapEl?.viewOnReady();
registerEventListeners();

function registerEventListeners() {
  setupSheetInteractions({ navigationEl, panelEl, sheetEl });
  searchEl?.addEventListener("arcgisSearchComplete", handleSearchComplete);
}

/**
 * Accessibility flow after a search completes:
 * 1) Wait once for the popup to open.
 * 2) Move focus into the popup so keyboard users land on result content.
 * 3) Wait once for popup close, then return focus to the search box.
 * 4) Once focus returns to the search component users can clear using esc key
 */
function handleSearchComplete() {
  const popupEl = getPopupElement();
  if (!popupEl) return;

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
 * Removes existing popup event listeners before creating new ones.
 * This prevents duplicate focus transitions after multiple searches.
 */
function clearPopupListeners() {
  removePopupOpenListener();
  removePopupCloseListeners();
  activePopupEl = null;
}

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

/**
 * Returns the popup element 
 */
function getPopupElement() {
  return mapEl?.popupElement ?? null;
}

/**
 * Set focus to the popup component.
 */
function focusPopupElement(popupEl) {
  if (!popupEl) return;
  popupEl?.setFocus();
}

/**
 * Return focus to the search component.
 */
function focusSearchInput() {
  if (!searchEl) return;
  searchEl.setFocus();
}