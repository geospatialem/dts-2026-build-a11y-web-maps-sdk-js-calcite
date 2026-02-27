import { setupSheetInteractions } from "../shared/shell-navigation.js";
import { mountAccessibilitySheet } from "../shared/accessibility-sheet.js";

// Define panel messages 
const DEFAULT_PANEL_HEADING = "Feature highlights";
const DEFAULT_GUIDANCE_MESSAGE =
  `Select "Load features in extent" to query all feature layers in the current map view.`;
const KEYBOARD_SHORTCUT_MESSAGE =
  "Press Home (or ⌘+↑ on Mac) to jump to the top and move focus to Load features.";
const INITIAL_GUIDANCE_MESSAGE = `${DEFAULT_GUIDANCE_MESSAGE} Tip: ${KEYBOARD_SHORTCUT_MESSAGE.charAt(0).toLowerCase()}${KEYBOARD_SHORTCUT_MESSAGE.slice(1)}`;

// Main page elements we interact with throughout this file.
const mapEl = document.querySelector("arcgis-map");
const featurePanelEl = document.getElementById("feature-panel");
const featureListEl = document.getElementById("feature-list");
const loadFeaturesButtonEl = document.getElementById("load-features-button");

const navigationEl = document.getElementById("nav");
const { panelEl, sheetEl } = mountAccessibilitySheet();

// Helps us ignore slower, outdated requests when a newer one finishes first.
let updateRequestId = 0;
// Reference to the currently highlighted feature so we can clear it.
let selectedHighlightHandle = null;
// Keeps track of the currently selected feature card in the panel.
let selectedFeatureItemEl = null;
// Feature layers found in the map when the app starts.
let featureLayers = [];
// Hidden live region used to announce short updates to screen readers.
let liveRegionEl = null;
// True when the panel is showing loaded feature results.
let hasVisibleResults = false;

// Wait until the map is ready before wiring events.
await mapEl?.viewOnReady();

setupSheetInteractions({ navigationEl, panelEl, sheetEl });

initializeFeaturePanel();

// Set up the panel and connect button/keyboard events.
function initializeFeaturePanel() {
  ensureLiveRegion();
  setLoadButtonState(false);

  featureLayers = getFeatureLayers();

  if (!featureLayers.length) {
    loadFeaturesButtonEl?.setAttribute("disabled", "true");
    renderMessage("No feature layers were found in this map.", "warning");
    return;
  }

  loadFeaturesButtonEl?.addEventListener("click", handleLoadFeaturesClick);
  featureListEl?.addEventListener("keydown", handleFeatureListKeydown);
  renderMessage(INITIAL_GUIDANCE_MESSAGE);
}

// Handle list shortcuts like Home / Ctrl+Home / Cmd+ArrowUp.
function handleFeatureListKeydown(event) {
  if (!featureListEl) return;

  if (!isScrollToTopShortcut(event)) return;

  event.preventDefault();
  featureListEl.scrollTo({ top: 0, behavior: "smooth" });
  loadFeaturesButtonEl?.setFocus();
}

// Returns true when the key combo means "jump to the top of the list".
function isScrollToTopShortcut(event) {
  const isHome = event.key === "Home";
  const isCtrlHome = event.ctrlKey && event.key === "Home";
  const isMacCommandUp = event.metaKey && event.key === "ArrowUp";

  return isHome || isCtrlHome || isMacCommandUp;
}

// Grab all feature layers from the map.
function getFeatureLayers() {
  const layers = mapEl?.map?.allLayers;
  if (!layers) return [];

  return layers.filter((layer) => layer?.type === "feature");
}

// Load features from all feature layers that intersect the current view.
async function updateFeaturesForCurrentExtent() {
  if (!featureListEl || !mapEl?.view?.extent) return;

  const requestId = ++updateRequestId;
  featureListEl.setAttribute("aria-busy", "true");
  loadFeaturesButtonEl.loading = true;
  renderMessage("Loading features in view…");

  try {
    const featureResults = await Promise.allSettled(
      featureLayers.map(async (layer) => {
        const query = layer.createQuery();
        query.geometry = mapEl.view.extent.clone();
        query.spatialRelationship = "intersects";
        const { features } = await layer.queryFeatures(query);

        return features.map((graphic) => ({
          graphic,
          layer
        }));
      })
    );

    if (requestId !== updateRequestId) return;

    const allFeatures = featureResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    renderFeatureComponents(allFeatures);
    announceLoadedResults(allFeatures);
  } catch {
    if (requestId !== updateRequestId) return;
    renderMessage("Unable to load features for the current extent.", "error");
  } finally {
    featureListEl.setAttribute("aria-busy", "false");
    loadFeaturesButtonEl.loading = false;
  }
}

// Main button behavior: either clear current results or load fresh ones.
function handleLoadFeaturesClick() {
  if (!featureLayers.length) return;

  if (hasVisibleResults) {
    resetPanelState({ showMessage: true });
    return;
  }

  clearActiveSelection();
  updateFeaturesForCurrentExtent();
}

// Return the panel to its default "ready to load" state.
function resetPanelState({ showMessage = false } = {}) {
  if (!featurePanelEl) return;

  clearActiveSelection();
  hasVisibleResults = false;
  setLoadButtonState(false);
  featurePanelEl.heading = DEFAULT_PANEL_HEADING;

  if (showMessage) {
    renderMessage(DEFAULT_GUIDANCE_MESSAGE);
  }
}

// Clear both map highlight and panel selection.
function clearActiveSelection() {
  clearHighlightedFeature();
  setSelectedFeatureItem(null);
}

// Render the results list, grouped by layer, with keyboard help at the top.
function renderFeatureComponents(featureResults) {
  if (!featureListEl || !featurePanelEl) return;

  featureListEl.innerHTML = "";
  featurePanelEl.heading = `Results: (${featureResults.length})`;

  if (!featureResults.length) {
    hasVisibleResults = false;
    setLoadButtonState(false);
    renderMessage("No features found in the current map extent.", "info");
    return;
  }

  hasVisibleResults = true;
  setLoadButtonState(true);

  const groupedResults = groupFeaturesByLayer(featureResults);
  const fragment = document.createDocumentFragment();

  fragment.appendChild(createKeyboardTipNotice());

  groupedResults.forEach(({ layer, items }, layerIndex) => {
    fragment.appendChild(createLayerBlock(layer, items, layerIndex));
  });

  featureListEl.appendChild(fragment);
}

// Let screen readers know how many features/layers were loaded.
function announceLoadedResults(featureResults) {
  if (!featureResults.length) return;

  const layerCount = new Set(featureResults.map((featureResult) => featureResult.layer?.id)).size;
  announceToScreenReader(`Loaded ${featureResults.length} features across ${layerCount} layers.`);
}

// Build the always-visible keyboard shortcuts notice shown with results.
function createKeyboardTipNotice() {
  const keyboardTipNoticeEl = document.createElement("calcite-notice");
  keyboardTipNoticeEl.open = true;
  keyboardTipNoticeEl.scale = "s";
  keyboardTipNoticeEl.width = "full";
  keyboardTipNoticeEl.kind = "brand";

  const keyboardTipTitleEl = document.createElement("span");
  keyboardTipTitleEl.slot = "title";
  keyboardTipTitleEl.textContent = "Keyboard shortcuts";

  const keyboardTipMessageEl = document.createElement("span");
  keyboardTipMessageEl.slot = "message";
  keyboardTipMessageEl.textContent = KEYBOARD_SHORTCUT_MESSAGE;

  keyboardTipNoticeEl.append(keyboardTipTitleEl, keyboardTipMessageEl);

  return keyboardTipNoticeEl;
}

// Build one expandable layer block and all of its feature cards.
function createLayerBlock(layer, items, layerIndex) {
  const layerBlockEl = document.createElement("calcite-block");
  layerBlockEl.heading = `${layer.title ?? "Untitled layer"} (${items.length})`;
  layerBlockEl.collapsible = true;
  layerBlockEl.open = layerIndex === 0;

  items.forEach(({ graphic }, featureIndex) => {
    layerBlockEl.appendChild(createFeatureBlock(graphic, layer, featureIndex));
  });

  return layerBlockEl;
}

// Build one feature card, including the zoom action and feature widget.
function createFeatureBlock(graphic, layer, featureIndex) {
  const featureBlockEl = document.createElement("calcite-block");
  const featureHeading = getFeatureHeading(graphic, layer, featureIndex);
  featureBlockEl.heading = featureHeading;
  featureBlockEl.collapsible = true;

  const zoomActionEl = document.createElement("calcite-action");
  zoomActionEl.slot = "content-end";
  zoomActionEl.icon = "magnifying-glass-plus";
  zoomActionEl.text = `Zoom to ${featureHeading}`;
  zoomActionEl.classList.add("feature-zoom-action");

  const featureComponent = document.createElement("arcgis-feature");
  featureComponent.graphic = graphic;
  featureComponent.map = mapEl?.map;
  featureComponent.tabIndex = 0;
  featureComponent.classList.add("feature-item-interactive");

  zoomActionEl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    highlightFeature(graphic, layer, featureComponent);
    zoomToFeature(graphic);
  });

  featureComponent.addEventListener("click", () => {
    highlightFeature(graphic, layer, featureComponent);
  });

  featureComponent.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    highlightFeature(graphic, layer, featureComponent);
  });

  featureBlockEl.append(zoomActionEl, featureComponent);

  return featureBlockEl;
}

// Group results by layer, then sort groups by layer title.
function groupFeaturesByLayer(featureResults) {
  const groupedByLayerId = new Map();

  featureResults.forEach((item) => {
    const layerId = item.layer?.id;
    if (!layerId) return;

    const existing = groupedByLayerId.get(layerId);
    if (existing) {
      existing.items.push(item);
      return;
    }

    groupedByLayerId.set(layerId, {
      layer: item.layer,
      items: [item]
    });
  });

  return Array.from(groupedByLayerId.values()).sort((a, b) => {
    const titleA = a.layer?.title ?? "";
    const titleB = b.layer?.title ?? "";
    return titleA.localeCompare(titleB);
  });
}

// Decide what label to show for each feature card.
function getFeatureHeading(featureGraphic, layer, index) {
  const attributes = featureGraphic?.attributes ?? {};
  const displayField = layer?.displayField;
  const displayValue = displayField ? attributes[displayField] : null;
  const objectIdField = layer?.objectIdField;
  const objectId = (objectIdField ? attributes[objectIdField] : null) ?? index + 1;

  return displayValue ? String(displayValue) : `Feature ${objectId}`;
}

// Mark a feature as selected and highlight it on the map.
async function highlightFeature(featureGraphic, layer, featureComponent) {
  const objectIdField = layer?.objectIdField;
  const objectId = objectIdField ? featureGraphic?.attributes?.[objectIdField] : null;
  if (!objectId) return;

  const featureLayerView = await getLayerViewForLayer(layer);
  if (!featureLayerView) return;

  openContainingBlocks(featureComponent);
  setSelectedFeatureItem(featureComponent);
  clearHighlightedFeature();

  try {
    selectedHighlightHandle = featureLayerView.highlight([objectId]);
  } catch {
    selectedHighlightHandle = null;
  }
}

// Get a layer view when needed: use existing mapEl.layerViews first, then fallback.
async function getLayerViewForLayer(layer) {
  if (!layer) return null;

  const existingLayerView =
    mapEl?.layerViews?.find?.((layerView) => layerView?.layer?.id === layer.id) ?? null;

  if (existingLayerView) {
    return existingLayerView;
  }

  try {
    return (await mapEl?.view?.whenLayerView(layer)) ?? null;
  } catch {
    return null;
  }
}

// Open parent blocks so the selected feature is always visible.
function openContainingBlocks(featureComponent) {
  if (!featureComponent) return;

  let parent = featureComponent.parentElement;

  while (parent) {
    if (parent.tagName === "CALCITE-BLOCK") {
      parent.open = true;
    }
    parent = parent.parentElement;
  }
}

// Zoom to the selected feature (fixed zoom for points, fit for other geometry types).
async function zoomToFeature(featureGraphic) {
  if (!mapEl?.view || !featureGraphic?.geometry) return;

  try {
    const { geometry } = featureGraphic;
    const isPoint = geometry?.type === "point";

    await mapEl.view.goTo(
      isPoint ? { target: geometry, zoom: 16 } : { target: featureGraphic },
      { animate: false }
    );
  } catch {
    // no-op
  }
}

// Remove the current map highlight, if there is one.
function clearHighlightedFeature() {
  selectedHighlightHandle?.remove();
  selectedHighlightHandle = null;
}

// Update which feature card is visually marked as selected.
function setSelectedFeatureItem(featureComponent) {
  selectedFeatureItemEl?.classList.remove("is-selected");
  selectedFeatureItemEl = featureComponent ?? null;
  selectedFeatureItemEl?.classList.add("is-selected");
}

// Show a panel notice and announce the same message to screen readers.
function renderMessage(message, type = "info") {
  if (!featureListEl || !featurePanelEl) return;

  featureListEl.innerHTML = "";

  const noticeEl = document.createElement("calcite-notice");
  noticeEl.open = true;
  noticeEl.scale = "s";
  noticeEl.width = "full";
  noticeEl.kind = type === "error" ? "danger" : type === "warning" ? "warning" : "brand";

  const titleEl = document.createElement("span");
  titleEl.slot = "title";
  titleEl.textContent = "Feature panel";

  const messageEl = document.createElement("span");
  messageEl.slot = "message";
  messageEl.appendChild(document.createTextNode(message));

  noticeEl.append(titleEl, messageEl);
  featureListEl.appendChild(noticeEl);

  const srPrefix = type === "error" ? "Error" : type === "warning" ? "Warning" : "Info";
  announceToScreenReader(`${srPrefix}: ${message}`, type === "error" ? "assertive" : "polite");
}

// Swap button text based on whether results are currently shown.
function setLoadButtonState(hasResults) {
  if (!loadFeaturesButtonEl) return;

  const buttonText = hasResults ? "Clear features" : "Load features in extent";
  const buttonIcon = hasResults ? "reset" : "search";

  loadFeaturesButtonEl.textContent = buttonText;
  loadFeaturesButtonEl.setAttribute("icon-start", buttonIcon);
}

// Create a hidden live region used for accessibility announcements.
function ensureLiveRegion() {
  if (liveRegionEl || !featurePanelEl) return;

  liveRegionEl = document.createElement("div");
  liveRegionEl.classList.add("sr-only");
  liveRegionEl.setAttribute("aria-live", "polite");
  liveRegionEl.setAttribute("aria-atomic", "true");
  featurePanelEl.appendChild(liveRegionEl);
}

// Announce updates for assistive tech without changing visible UI text.
function announceToScreenReader(message, mode = "polite") {
  if (!liveRegionEl) return;

  liveRegionEl.setAttribute("aria-live", mode);
  liveRegionEl.textContent = "";
  // Wait one frame so repeated announcements are more reliably picked up.
  requestAnimationFrame(() => {
    if (!liveRegionEl) return;
    liveRegionEl.textContent = message;
  });
}