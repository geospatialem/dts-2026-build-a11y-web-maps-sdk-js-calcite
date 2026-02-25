const toggleModeEl = document.getElementById("toggle-mode");
const navigationEl = document.getElementById("nav");
const panelEl = document.getElementById("sheet-panel");
const sheetEl = document.getElementById("sheet");
const mapEl = document.getElementById("map-el");
const alertEl = document.getElementById("alert-el");
const alertTitleEl = document.getElementById("alert-title");
const languageCombobox = document.getElementById("languageCombobox");
let mode = "light";

loadModuleAndRun();

let highContrastDarkTileLayer;
let highContrastLightTileLayer;

async function loadModuleAndRun() {

  // Load modules
  const [esriRequest, Basemap, VectorTileLayer] = await $arcgis.import([
    "@arcgis/core/request.js",
    "@arcgis/core/Basemap.js",
    "@arcgis/core/layers/VectorTileLayer.js"
  ]);

  // High contrast light layer
  highContrastLightTileLayer = new VectorTileLayer({
    portalItem: {
      id: "d6e5bfbe9e0b4ad0bd200262bef745b0"
    },
    title: "High contrast light theme",
    id: "high-contrast-light",
  });

  // High contrast dark layer
  highContrastDarkTileLayer = new VectorTileLayer({
    portalItem: {
      id: "4dd826e83b044acfb519a26fc9b20f80"
    },
    title: "High contrast dark theme",
    id: "high-contrast-dark",
  });

  // Initial map configuration
  mapEl.map = {
    basemap: new Basemap({
      style: {
        id: `arcgis/${mode}-gray/labels`,
        // Get the language from the body
        language: document.documentElement.lang,
      },
    }),
    layers: [highContrastLightTileLayer]
  }
  
  // Update combobox values with languages from rest endpoint
  const basemapStylesEndpoint = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/self";
  esriRequest(basemapStylesEndpoint, {
    responseType: "json",
  }).then((response) => {
    const json = response.data;
    // Add each language as a Combobox Item
    json.languages.forEach((language) => {
      const comboboxItem = document.createElement("calcite-combobox-item");
      comboboxItem.value = language.code;
      comboboxItem.heading = `${language.code} - ${language.name}`;
      // if the current basemap language is the same as the combobox item, select it
      comboboxItem.selected = mapEl.map.basemap.style.language === language.code;
      languageCombobox.appendChild(comboboxItem);
   });
  });

  // Update the language
  const updateLanguage = (languageCode) => {
    // Update the HTML body's language
    document.documentElement.setAttribute("lang", languageCode);
    // Update the basemap's language
    const tileLayerName = mode === "dark" ? highContrastDarkTileLayer : highContrastLightTileLayer;

      mapEl.map = {
        basemap: new Basemap({
          style: {
            id: `arcgis/${mode}-gray/labels`,
            language: languageCode,
          },
        }),
        layers: [tileLayerName]
      }
  };

  // When the Combobox value changes
  // 1. Update the language
  // 2. Provide context to the alert and shift focus
  languageCombobox.addEventListener("calciteComboboxChange", () => {
    updateLanguage(languageCombobox.value);

    alertTitleEl.innerHTML = `Switched the language to "${languageCombobox.value}".`;

    if (alertEl.open) {
      (async () => {
        await languageCombobox.componentOnReady();
        requestAnimationFrame(() => alertEl.setFocus());
      })();
    } else {
      alertEl.open = true;
    }
  });
}

mapEl.addEventListener("arcgisViewReadyChange", async () => {  
  await mapEl.viewOnReady();
  // Hide the loader
  document.querySelector("calcite-loader").hidden = true;
});

toggleModeEl.addEventListener("click", () => handleModeChange());
navigationEl.addEventListener("calciteNavigationActionSelect", () =>
  handleSheetOpen(),
);
panelEl.addEventListener("calcitePanelClose", () => handlePanelClose());

function handleModeChange() {
  alertTitleEl.innerText = "Loading the map...";
  mode = mode === "dark" ? "light" : "dark";
  const isDarkMode = mode === "dark";
  mapEl.map.basemap.style.id = `arcgis/${mode}-gray/labels`;
  mapEl.map.layers = isDarkMode ? [highContrastDarkTileLayer] : [highContrastLightTileLayer];
  toggleModeEl.icon = isDarkMode ? "moon" : "brightness";
  document.body.classList.toggle("calcite-mode-dark");
  // Provide context to the alert and shift focus
  alertTitleEl.innerHTML = `Switched to ${mode} mode.`;
  
  if (alertEl.open) {
    alertEl.setFocus();
  } else {
    alertEl.open = true;
  }
}

function handleSheetOpen() {
  sheetEl.open = true;
  panelEl.closed = false;
}

function handlePanelClose() {
  sheetEl.open = false;
}

// When the alert is open, set focus on the component
alertEl.addEventListener("calciteAlertOpen", () => {
  alertEl.setFocus();
})