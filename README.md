# Building Accessible Web Apps with ArcGIS Maps SDK for JavaScript and Calcite

Presented at the 2026 Esri Developer Summit by Kelly Hutchins and Kitty Hurley in Palm Springs, California.

- [Demo Site](https://geospatialem.github.io/dts-2026-build-a11y-web-maps-sdk-js-calcite)
- [Code](https://github.com/geospatialem/dts-2026-build-a11y-web-maps-sdk-js-calcite)
- _Slides, will be posted at a later time_

## Demos

1. [Map Description and Live Regions](demos/description-region/index.html)
   - Provide context as to when the map has loaded and include a description when the map is in focus to further [WCAG's 1.3.1: Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) Success Criterion.
2. [Visual Scale](demos/visual-scale/)
   - Demonstrates how to use the `visualScale` property to increase the size of map UI controls, including Expand, Zoom, and Home.
3. [Expand Component](demos/expand-component/)
   - Demonstrates Expand behavior with focus trap handling using focus-trap-disabled and close-on-esc-disabled.
   - Shows explicit focus management between Search and Popup: focus moves to the popup after search completes, then returns to Search when the popup closes.
   - Supports both the default locator and a layer-based search source in the web map, including census tract search with keyboard access to popup details.
4. [Reduced Motion](demos/reduced-motion)
   - Shows how map animations can respect the user’s motion preference.
   - Includes controls to explicitly play or pause animation.
   - Note: disabling animation affects all animation, including goTo zoom transitions.
5. [High Contrast](demos/high-contrast/)
   - Showcase high-contrast basemaps and Calcite theming to improve perceivability for users with low vision in line with [WCAG's 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) Success Criterion.
6. [Consistent focus](demos/consistent-focus)

## Resources

- [Calcite Accessibility](https://developers.arcgis.com/calcite-design-system/foundations/accessibility)
- [ArcGIS Maps SDK for JavaScript accessibility](https://developers.arcgis.com/javascript/latest/accessibility)
- [Subscribe to the Esri accessibility community](https://community.esri.com/t5/accessibility/ct-p/accessibility)
