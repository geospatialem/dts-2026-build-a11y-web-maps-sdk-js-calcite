export function mountAccessibilitySheet({
    parent = document.body,
    sheetLabel,
    hideNote = false
} = {}) {
    if (!parent) return { sheetEl: null, panelEl: null };

    const existingSheetEl = parent.querySelector("#sheet");
    if (existingSheetEl) {
        return {
            sheetEl: existingSheetEl,
            panelEl: existingSheetEl.querySelector("#sheet-panel")
        };
    }

    const sheetWrapper = document.createElement("div");
    const sheetLabelAttribute = sheetLabel ? ` label="${sheetLabel}"` : "";
    const noteHiddenAttribute = hideNote ? " hidden" : "";

    sheetWrapper.innerHTML = `
    <calcite-sheet id="sheet" display-mode="float" width-scale="m"${sheetLabelAttribute}>
      <calcite-panel heading="Accessibility resources" description="Helpful resources and links" closable id="sheet-panel">
        <calcite-menu layout="vertical" label="2026 Esri Developer & Technology Summit Menu">
          <calcite-menu-item text="GitHub repository" icon-end="launch" href="https://github.com/geospatialem/dts-2026-build-a11y-web-maps-sdk-js-calcite" target="_blank" rel="noopener noreferrer"></calcite-menu-item>
          <calcite-menu-item text="Accessibility: Calcite Design System" icon-end="launch" href="https://developers.arcgis.com/calcite-design-system/foundations/accessibility/" target="_blank" rel="noopener noreferrer"></calcite-menu-item>
          <calcite-menu-item text="Accessibility: ArcGIS Maps SDK for JavaScript" icon-end="launch" href="https://developers.arcgis.com/javascript/latest/accessibility" target="_blank" rel="noopener noreferrer"></calcite-menu-item>
          <calcite-menu-item text="Esri accessibility community" icon-end="launch" href="https://esriurl.com/a11y-community" target="_blank" rel="noopener noreferrer"></calcite-menu-item>
        </calcite-menu>
        <calcite-notice id="sheet-note" open slot="footer" width="full" scale="s"${noteHiddenAttribute}>
          <span slot="title">Note</span>
          <span slot="message">
            This is a demonstration application showcasing platform functionality. While Esri strives to ensure the sample is accurate,
            it may not reflect implementation behavior in certain environments.
          </span>
        </calcite-notice>
      </calcite-panel>
    </calcite-sheet>
  `;

    const sheetEl = sheetWrapper.firstElementChild;
    if (!sheetEl) return { sheetEl: null, panelEl: null };

    parent.appendChild(sheetEl);

    return {
        sheetEl,
        panelEl: sheetEl.querySelector("#sheet-panel")
    };
}
