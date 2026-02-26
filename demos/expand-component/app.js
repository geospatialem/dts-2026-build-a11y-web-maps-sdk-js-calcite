const mapEl = document.querySelector("arcgis-map");
const searchEl = document.querySelector("arcgis-search");

const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");

const [reactiveUtils] = await $arcgis.import(["esri/core/reactiveUtils"]);

/**
 * Tracks active reactiveUtils watchers so repeated searches do not stack listeners.
 */
let popupOpenWatchHandle = null;
let popupCloseWatchHandle = null;

await mapEl?.viewOnReady();
registerEventListeners();

function registerEventListeners() {
  panelEl?.addEventListener("calcitePanelClose", handlePanelClose);
  navigationEl?.addEventListener("calciteNavigationActionSelect", handleSheetOpen);
  searchEl?.addEventListener("arcgisSearchComplete", handleSearchComplete);
}

function handleSheetOpen() {
  if (!sheetEl || !panelEl) return;
  sheetEl.open = true;
  panelEl.closed = false;
}

function handlePanelClose() {
  if (!sheetEl) return;
  sheetEl.open = false;
}

/**
 * Accessibility flow after a search completes:
 * 1) Wait once for the popup to open.
 * 2) Move focus into the popup so keyboard users land on result content.
 * 3) Wait once for popup close, then return focus to the search box.
 * 4) Once focus returns to the search component users can clear using esc key
 */
function handleSearchComplete() {
  clearPopupWatchers();

  popupOpenWatchHandle = reactiveUtils.when(
    () => getPopupElement()?.open,
    () => {
      const popupEl = getPopupElement();
      if (!popupEl) return;

      focusPopupElement(popupEl);

      popupCloseWatchHandle = reactiveUtils.when(
        () => !popupEl.open,
        () => {
          focusSearchInput();
          popupCloseWatchHandle?.remove();
          popupCloseWatchHandle = null;
        },
        { once: true }
      );
    },
    { once: true }
  );
}


/**
 * Removes existing watcher handles before creating new ones.
 * This prevents duplicate focus transitions after multiple searches.
 */
function clearPopupWatchers() {
  popupOpenWatchHandle?.remove();
  popupCloseWatchHandle?.remove();
  popupOpenWatchHandle = null;
  popupCloseWatchHandle = null;
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