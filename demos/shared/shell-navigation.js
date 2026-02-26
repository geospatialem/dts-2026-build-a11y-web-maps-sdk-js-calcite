export function setupSheetInteractions({ navigationEl, panelEl, sheetEl }) {
    if (!sheetEl) {
        return {
            openSheet: () => { },
            closeSheet: () => { },
            destroy: () => { }
        };
    }

    const openSheet = () => {
        if (!panelEl) return;
        sheetEl.open = true;
        panelEl.closed = false;
    };

    const closeSheet = () => {
        sheetEl.open = false;
    };

    navigationEl?.addEventListener("calciteNavigationActionSelect", openSheet);
    panelEl?.addEventListener("calcitePanelClose", closeSheet);

    const destroy = () => {
        navigationEl?.removeEventListener("calciteNavigationActionSelect", openSheet);
        panelEl?.removeEventListener("calcitePanelClose", closeSheet);
    };

    return { openSheet, closeSheet, destroy };
}
