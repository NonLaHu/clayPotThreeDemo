import { createSave, uploadPhoto, fetchSave } from "./saveApi.js";
import { renderPoster } from "./poster.js";
import { showSaveExport, showExportChoice } from "./exportOverlay.js";
import { showLoadConfirm } from "./loadConfirm.js";
import { showLoadCode } from "./loadCode.js";
import { codeToId } from "./code.js";
import { capturePotState } from "./restorePot.js";
import { printPoster } from "./printPoster.js";
import { showCreatorNamePrompt } from "./creatorNamePrompt.js";

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
  };
}

// ------------------------------------------------------------
// Private helpers for the two export paths
// ------------------------------------------------------------

async function exportQR({ renderer, scene, camera, geometry, getCameraAngle, getPatternState, boothLabel }) {
  const angle = getCameraAngle();
  const state = capturePotState(geometry, getPatternState?.());
  const { id } = await createSave({ ...state, angle });
  const poster = await renderPoster({ renderer, scene, camera, id, boothLabel });
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
