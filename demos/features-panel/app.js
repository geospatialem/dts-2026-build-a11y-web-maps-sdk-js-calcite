import { setupSheetInteractions } from "../shared/shell-navigation.js";
import { mountAccessibilitySheet } from "../shared/accessibility-sheet.js";

const mapEl = document.querySelector("arcgis-map");
const featurePanelEl = document.getElementById("feature-panel");
const featureListEl = document.getElementById("feature-list");
const loadFeaturesButtonEl = document.getElementById("load-features-button");

const navigationEl = document.getElementById("nav");
const { panelEl, sheetEl } = mountAccessibilitySheet();

let updateRequestId = 0;
let selectedHighlightHandle = null;
let featureLayerViewPromise = null;
let selectedFeatureItemEl = null;
let featureLayer = null;

await mapEl?.viewOnReady();

setupSheetInteractions({ navigationEl, panelEl, sheetEl });

initializeFeaturePanel();

function initializeFeaturePanel() {
  featureLayer = getFirstFeatureLayer();

  if (!featureLayer) {
    loadFeaturesButtonEl?.setAttribute("disabled", "true");
    renderMessage("No feature layer was found in this map.");
    return;
  }

  featureLayerViewPromise = mapEl.view?.whenLayerView(featureLayer) ?? null;

  loadFeaturesButtonEl?.addEventListener("click", handleLoadFeaturesClick);
  renderMessage("Select “Load features in extent” to query features in the current map view.");
}

function getFirstFeatureLayer() {
  const layers = mapEl?.map?.allLayers;
  if (!layers) return null;

  return layers.find((layer) => layer?.type === "feature") ?? null;
}

async function updateFeaturesForCurrentExtent(featureLayer) {
  if (!featureListEl || !mapEl?.view?.extent) return;

  const requestId = ++updateRequestId;
  loadFeaturesButtonEl.loading = true;
  renderMessage("Loading features in view…");

  const query = featureLayer.createQuery();
  query.geometry = mapEl.view.extent.clone();
  query.spatialRelationship = "intersects";
  query.outFields = ["*"];
  query.returnGeometry = true;

  try {
    const { features } = await featureLayer.queryFeatures(query);

    if (requestId !== updateRequestId) return;

    renderFeatureComponents(features);
  } catch {
    if (requestId !== updateRequestId) return;
    renderMessage("Unable to load features for the current extent.");
  } finally {
    loadFeaturesButtonEl.loading = false;
  }
}

function handleLoadFeaturesClick() {
  if (!featureLayer) return;

  clearHighlightedFeature();
  setSelectedFeatureItem(null);
  updateFeaturesForCurrentExtent(featureLayer);
}

function renderFeatureComponents(features) {
  if (!featureListEl || !featurePanelEl) return;

  featureListEl.innerHTML = "";
  featurePanelEl.heading = `Results: (${features.length})`;

  if (!features.length) {
    renderMessage("No features found in the current map extent.");
    return;
  }

  const fragment = document.createDocumentFragment();

  features.forEach((featureGraphic, index) => {
    const featureBlockEl = document.createElement("calcite-block");
    featureBlockEl.heading = getFeatureHeading(featureGraphic, index);
    featureBlockEl.collapsible = true;
    featureBlockEl.open = index === 0;

    const featureComponent = document.createElement("arcgis-feature");
    featureComponent.graphic = featureGraphic;
    featureComponent.map = mapEl?.map;
    featureComponent.classList.add("feature-item-interactive");


    featureComponent.addEventListener("click", () => {
      highlightFeature(featureGraphic, featureComponent);
    });

    featureComponent.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      highlightFeature(featureGraphic, featureComponent);
    });

    featureBlockEl.appendChild(featureComponent);
    fragment.appendChild(featureBlockEl);
  });

  featureListEl.appendChild(fragment);
}

function getFeatureHeading(featureGraphic, index) {
  const attributes = featureGraphic?.attributes ?? {};
  const displayField = featureLayer?.displayField;
  const displayValue = displayField ? attributes[displayField] : null;
  const objectId = attributes.OBJECTID ?? index + 1;

  return displayValue ? String(displayValue) : `Feature ${objectId}`;
}

async function highlightFeature(featureGraphic, featureComponent) {
  const objectId = featureGraphic?.attributes?.OBJECTID;
  if (!objectId || !featureLayerViewPromise) return;

  setSelectedFeatureItem(featureComponent);
  clearHighlightedFeature();

  try {
    const featureLayerView = await featureLayerViewPromise;
    selectedHighlightHandle = featureLayerView.highlight([objectId]);
  } catch {
    selectedHighlightHandle = null;
  }

  panToFeature(featureGraphic);
}

async function panToFeature(featureGraphic) {
  if (!mapEl?.view || !featureGraphic?.geometry) return;

  try {
    await mapEl.view.goTo(featureGraphic, { animate: false });
  } catch {
    // no-op
  }
}

function clearHighlightedFeature() {
  selectedHighlightHandle?.remove();
  selectedHighlightHandle = null;
}

function setSelectedFeatureItem(featureComponent) {
  selectedFeatureItemEl?.classList.remove("is-selected");
  selectedFeatureItemEl = featureComponent ?? null;
  selectedFeatureItemEl?.classList.add("is-selected");
}

function renderMessage(message) {
  if (!featureListEl || !featurePanelEl) return;

  featureListEl.innerHTML = "";

  const noticeEl = document.createElement("calcite-notice");
  noticeEl.open = true;
  noticeEl.scale = "s";
  noticeEl.width = "full";

  const titleEl = document.createElement("span");
  titleEl.slot = "title";
  titleEl.textContent = "Feature panel";

  const messageEl = document.createElement("span");
  messageEl.slot = "message";
  messageEl.textContent = message;

  noticeEl.append(titleEl, messageEl);
  featureListEl.appendChild(noticeEl);
}