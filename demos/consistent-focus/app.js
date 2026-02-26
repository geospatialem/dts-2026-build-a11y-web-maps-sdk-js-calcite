const toggleModeEl = document.getElementById("toggle-mode");
const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");
const mapEl = document.getElementById("map-el");
const actionBarEl = document.getElementById("custom-action-bar");
const searchEl = document.getElementById("search-el");
const expandEl = document.getElementById("expand-el");

let mode = "light";


// Wait for the view's ready change
mapEl.addEventListener("arcgisViewReadyChange", async () => {
  const { portalItem } = mapEl.map;
  mapEl.aria = {
    label: portalItem.title,
    description: portalItem.snippet,
  };
  
  // Wait for the internal view to be ready
  // [2] Once ready provide context the map has loaded
  await mapEl.viewOnReady();
  document.querySelector("calcite-loader").hidden = true;

  updateBloom(bloomIntensity, bloomRadius, bloomThreshold);

});

toggleModeEl.addEventListener("click", () => handleModeChange());
navigationEl.addEventListener("calciteNavigationActionSelect", () =>
  handleSheetOpen(),
);
panelEl.addEventListener("calcitePanelClose", () => handlePanelClose());


function handleModeChange() {
  document.querySelector("calcite-loader").removeAttribute("hidden");
  mode = mode === "dark" ? "light" : "dark";
  const isDarkMode = mode === "dark";
  toggleModeEl.icon = isDarkMode ? "moon" : "brightness";
  mapEl.basemap = isDarkMode ? "dark-gray" : "gray";
  document.body.classList.toggle("calcite-mode-dark");
}

function handleSheetOpen() {
  sheetEl.open = true;
  panelEl.closed = false;
}

function handlePanelClose() {
  sheetEl.open = false;
}

// Active widget
let activeWidget = "";

// Layer effects
const effectBlockSectionEl = document.getElementById("bloom-effect");
const shadowBlockSectionEl = document.getElementById("shadow-effect");

let bloomIntensity = 1.5;
let bloomRadius = 0.5;
let bloomThreshold = 0.1;

let shadowLength = 3;
let shadowDepth = 1;
let shadowOutline = 3;

// Bloom effects
effectBlockSectionEl.addEventListener("calciteBlockSectionToggle", (evt) => {
  if (evt.target.expanded) {
    shadowBlockSectionEl.expanded = false;
    updateBloom(bloomIntensity, bloomRadius, bloomThreshold);
  } else {
    updateBloom(0, 0, 0);
  }
});

// Drop shadow effects
shadowBlockSectionEl.addEventListener("calciteBlockSectionToggle", (evt) => {
  if (evt.target.expanded) {
    effectBlockSectionEl.expanded = false;
    updateShadow(shadowLength, shadowDepth, shadowOutline);
  } else {
    updateShadow(0, 0, 0);
  }
});

  // Layer effect values
const sliderEls = document.querySelectorAll("calcite-slider");
sliderEls?.forEach((sliderEl) => {
  sliderEl.addEventListener("calciteSliderInput", () => {
    const sliderElId = sliderEl.id;
    // Bloom effects
    if (sliderElId.includes("bloom")) {
      bloomIntensity = document.getElementById("bloom-intensity").value;
      bloomRadius = document.getElementById("bloom-radius").value;
      bloomThreshold = document.getElementById("bloom-threshold").value;
      if (effectBlockSectionEl.expanded) {
        updateBloom(bloomIntensity, bloomRadius, bloomThreshold);
      }
      // Drop shadow effects
    } else if (sliderElId.includes("shadow")) {
      shadowLength = document.getElementById("shadow-length").value;
      shadowDepth = document.getElementById("shadow-depth").value;
      shadowOutline = document.getElementById("shadow-outline").value;
      if (shadowBlockSectionEl.expanded) {
        updateShadow(shadowLength, shadowDepth, shadowOutline);
      }
    }
  });
});

// Bloom effect
function updateBloom(bloomIntensity, bloomRadius, bloomThreshold) {
  mapEl.map.layers._items[0].effect = `bloom(${bloomIntensity}, ${bloomRadius}px, ${bloomThreshold})`;
}

// Drop shadow effect
function updateShadow(shadowLength, shadowDepth, shadowOutline) {
  mapEl.map.layers.items[0].effect = `drop-shadow(${shadowLength}px, ${shadowDepth}px, ${shadowOutline}px)`;
}

// Active action
const handleActionBarClick = ({ target }) => {
  if (target.tagName !== "CALCITE-ACTION") {
    return;
  }

  if (activeWidget) {
    activeActionEl = document
      .querySelector(`[data-action-id=${activeWidget}]`)
      .removeAttribute("active");
    activePanelEl = document.querySelector(
      `[data-panel-id=${activeWidget}]`
    ).closed = true;
  }

  const nextWidget = target.dataset.actionId;
  if (nextWidget !== activeWidget) {
    document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
    document.querySelector(`[data-panel-id=${nextWidget}]`).closed = false;
    activeWidget = nextWidget;
    document.querySelector(`[data-panel-id=${nextWidget}]`).setFocus();
  } else {
    activeWidget = null;
  }
};

actionBarEl.addEventListener("click", handleActionBarClick);

// Panel interaction
const panelEls = [...document.querySelectorAll("calcite-panel")];
  panelEls.forEach((panelEl) => {
    panelEl.addEventListener("calcitePanelClose", () => {
      if (panelEl.id !== "sheet-panel") {
        document.querySelector(`[data-action-id=${activeWidget}]`).closed = true;
        document.querySelector(`[data-action-id=${activeWidget}]`).active = false;
        document.querySelector(`[data-action-id=${activeWidget}]`).setFocus();
        activeWidget = null;
      }
    });
  });

  // Adjust the Map copyright when the Action Bar's expansion is toggled
  actionBarEl.addEventListener("calciteActionBarToggle", () => {
    const expandText = actionBarEl.expanded ? "135px" : "45px";
    mapEl.style.setProperty("--arcgis-layout-overlay-space-left", expandText);
  });