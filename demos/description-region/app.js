import { setupSheetInteractions } from "../shared/shell-navigation.js";

const toggleModeEl = document.getElementById("toggle-mode");
const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");
const mapEl = document.getElementById("map-el");
const alertEl = document.getElementById("alert-el");
const alertTitleEl = document.getElementById("alert-title");
const assistiveContextEl = document.getElementById("assistive-context");
const hiddenElements = document.querySelectorAll('[hidden]');

// Add hidden elements to the UI
hiddenElements.forEach(hiddenElement => {
  hiddenElement.removeAttribute("hidden");
});

// Wait for the view's ready change
mapEl.addEventListener("arcgisViewReadyChange", async () => {
  mapEl.removeAttribute("hidden");
  // [1] Get the portal item reference for the alert and map's aria properties
  const { portalItem } = mapEl.map;
  mapEl.aria = {
    label: portalItem.title,
    description: portalItem.snippet,
  };

  // Wait for the internal view to be ready
  // [2] Once ready provide context the map has loaded
  await mapEl.viewOnReady();
  alertTitleEl.innerText = `The "${portalItem.title}" map has loaded.`;
  document.querySelector("calcite-loader").hidden = true;

  // [3] If open, set focus on the alert
  if (alertEl.open) {
    alertEl.setFocus();
  };

  // If not already open, set the alert to be open
  alertEl.open = true;
});

let mode = "light";

toggleModeEl.addEventListener("click", () => handleModeChange());
setupSheetInteractions({ navigationEl, panelEl, sheetEl });


function handleModeChange() {
  alertTitleEl.innerText = "Loading the map...";
  document.querySelector("calcite-loader").removeAttribute("hidden");
  mapEl.toggleAttribute("hidden");
  mode = mode === "dark" ? "light" : "dark";
  const isDarkMode = mode === "dark";
  mapEl.itemId = isDarkMode
    ? "d5dda743788a4b0688fe48f43ae7beb9"
    : "05e015c5f0314db9a487a9b46cb37eca";
  toggleModeEl.icon = isDarkMode ? "moon" : "brightness";
  document.body.classList.toggle("calcite-mode-dark");

  const inverseMode = mode === "light" ? "dark" : "light";
  const modeDescription = mode === "light" ? "polygons" : "clusters";
  // [4] Inform assistive technologies of the mode change
  assistiveContextEl.textContent = `Switched to ${mode} mode with data displayed as ${modeDescription}. Toggle to ${inverseMode} mode.`;
}

// [5] When the alert is open, set focus on the component
alertEl.addEventListener("calciteAlertOpen", () => {
  alertEl.setFocus();
})