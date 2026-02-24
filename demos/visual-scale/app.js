const mapEl = document.querySelector("arcgis-map");
const toggleScaleEl = document.getElementById("toggle-scale");
await mapEl?.viewOnReady();

if (toggleScaleEl && mapEl) {
  toggleScaleEl.addEventListener("click", () => {
    const slottedComponents = mapEl.querySelectorAll("[slot]");
    const nextScale = Array.from(slottedComponents).some((el) => el.visualScale === "l") ? "m" : "l";
    // set the visual scale for the slotted components
    slottedComponents.forEach((componentEl) => {
      componentEl.visualScale = nextScale;
      componentEl.setAttribute("visual-scale", nextScale);
    });
  });
}




