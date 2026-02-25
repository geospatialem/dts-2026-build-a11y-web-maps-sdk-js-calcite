const mapEl = document.querySelector("arcgis-map");

const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");

await mapEl?.viewOnReady();

panelEl?.addEventListener("calcitePanelClose", handlePanelClose);
navigationEl?.addEventListener("calciteNavigationActionSelect", handleSheetOpen);

// TODO wait for API issue then handle popup focus state

function handleSheetOpen() {
  if (!sheetEl || !panelEl) return;
  sheetEl.open = true;
  panelEl.closed = false;
}

function handlePanelClose() {
  if (!sheetEl) return;
  sheetEl.open = false;
}