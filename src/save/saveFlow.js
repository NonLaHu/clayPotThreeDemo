import { createSave, uploadPhoto, fetchSave } from "./saveApi.js";
import { renderPoster } from "./poster.js";
import { showSaveExport, showExportChoice, showViewerChoice } from "./exportOverlay.js";
import { showLoadConfirm } from "./loadConfirm.js";
import { showLoadCode } from "./loadCode.js";
import { codeToId } from "./code.js";
import { capturePotState } from "./restorePot.js";
import { printPoster } from "./printPoster.js";
import { showCreatorNamePrompt } from "./creatorNamePrompt.js";
import { downloadGLB } from "./export3d.js";
import { makeSaveUrl } from "./qr.js";

/**
 * Ties together the save flow:
 *  - Export: shows a choice popup (QR Code | Print), then either:
 *    QR: capture state -> save to booth server -> build poster -> upload photo -> show QR
 *    Print: capture state -> save to booth server -> render scene -> open print dialog
 *  - Import: student types the save code from their poster into the
 *    "Load Progress" prompt; on match, ask if they want to load that pot back.
 */
export function createSaveFlow(options) {
  const {
    renderer,
    scene,
    camera,
    geometry,
    getCameraAngle,
    getPatternState,
    onRestore,
    boothLabel = "Exhibition",
  } = options;

  return {
    async exportCurrentWork() {
      showExportChoice({
        onQR: () => {
          exportQR({ renderer, scene, camera, geometry, getCameraAngle, getPatternState, boothLabel })
            .catch((error) => {
              console.error("QR export failed:", error);
            });
        },
        onPrint: () => {
          exportPrint({ renderer, scene, camera, geometry, getCameraAngle, getPatternState, boothLabel })
            .catch((error) => {
              console.error("Print export failed:", error);
            });
        },
        onGLB: () => exportsGLBFlow({ geometry, getPatternState }),
      });
    },

    loadByCode() {
      return showLoadCode({
        onLoad: async (rawCode) => {
          const id = codeToId(rawCode);

          let save;

          try {
            save = await fetchSave(id);
          } catch {
            throw new Error(
              "No save found with that code. Check the code on your poster and try again.",
            );
          }

          const confirmed = await showLoadConfirm({ id: save.id });

          if (!confirmed) {
            return false;
          }

          if (typeof onRestore === "function") {
            onRestore(save);
          }

          return true;
        },
      });
    },

    // Opens the standalone 3D viewer page. Asks first whether to view the
    // current pot (saves it on the fly, then opens it) or load a saved pot by
    // code.
    view3D() {
      return showViewerChoice({
        onCurrentPot: () => {
          viewCurrentIn3D({
            geometry,
            getCameraAngle,
            getPatternState,
          }).catch((error) => {
            console.error("Open 3D viewer for current pot failed:", error);
          });
        },
        onLoadPot: () => {
          loadPotIn3D().catch((error) => {
            console.error("Load pot in 3D viewer failed:", error);
          });
        },
      });
    },
  };
}

// Saves the current pot, then opens its 3D viewer page in a new tab.
async function viewCurrentIn3D({ geometry, getCameraAngle, getPatternState }) {
  const angle = getCameraAngle();
  const state = capturePotState(geometry, getPatternState?.());
  const { id } = await createSave({ ...state, angle });

  const viewerUrl = await makeSaveUrl(`/s/${id}`);
  window.open(viewerUrl, "_blank", "noopener,noreferrer");
  return id;
}

// Prompts for a save code, then opens that pot in the 3D viewer page.
function loadPotIn3D() {
  return showLoadCode({
    onLoad: async (rawCode) => {
      const id = codeToId(rawCode);
      const viewerUrl = await makeSaveUrl(`/s/${id}`);
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
      return true;
    },
  });
}

// ------------------------------------------------------------
// Private helpers for the two export paths
// ------------------------------------------------------------

async function exportQR({ renderer, scene, camera, geometry, getCameraAngle, getPatternState, boothLabel }) {
  const creatorName = await showCreatorNamePrompt();

  if (creatorName === null) return;

  const angle = getCameraAngle();
  const state = capturePotState(geometry, getPatternState?.());
  const { id } = await createSave({ ...state, angle });
  const poster = await renderPoster({ renderer, scene, camera, id, boothLabel, creatorName });
  await uploadPhoto(id, poster);
  showSaveExport({ id });
  return id;
}

async function exportPrint({ renderer, scene, camera, geometry, getCameraAngle, getPatternState, boothLabel }) {
  const creatorName = await showCreatorNamePrompt();

  if (creatorName === null) return;

  const angle = getCameraAngle();
  const state = capturePotState(geometry, getPatternState?.());
  await createSave({ ...state, angle });
  await printPoster({ renderer, scene, camera, creatorName });
}

function exportsGLBFlow({ geometry, getPatternState }) {
  const state = capturePotState(geometry, getPatternState?.());
  return downloadGLB({
    positions: state.positions,
    colors: state.colors,
    patterns: state.patterns,
    id: "export",
  });
}
