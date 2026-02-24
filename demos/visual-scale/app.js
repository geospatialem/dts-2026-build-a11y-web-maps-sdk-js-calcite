const mapEl = document.querySelector("arcgis-map");
const toggleScaleEl = document.getElementById("toggle-scale");

const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");

await mapEl?.viewOnReady();
// Toggle the visual scale of slotted components in the map when the button is clicked
if (toggleScaleEl && mapEl) {
  toggleScaleEl.addEventListener("click", () => {
    const slottedComponents = mapEl.querySelectorAll("[slot]");
    const nextScale = Array.from(slottedComponents).some((el) => el.visualScale === "l") ? "m" : "l";

    slottedComponents.forEach((componentEl) => {
      componentEl.visualScale = nextScale;
      componentEl.setAttribute("visual-scale", nextScale);
    });
  });
}

panelEl?.addEventListener("calcitePanelClose", handlePanelClose);
navigationEl?.addEventListener("calciteNavigationActionSelect", handleSheetOpen);

function handleSheetOpen() {
  if (!sheetEl || !panelEl) return;
  sheetEl.open = true;
  panelEl.closed = false;
}

function handlePanelClose() {
  if (!sheetEl) return;
  sheetEl.open = false;
}