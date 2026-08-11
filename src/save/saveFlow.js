import { createSave, uploadPhoto, fetchSave } from "./saveApi.js";
import { renderPoster } from "./poster.js";
import { showSaveExport } from "./exportOverlay.js";
import { showLoadConfirm } from "./loadConfirm.js";
import { showLoadCode } from "./loadCode.js";
import { codeToId } from "./code.js";
import { capturePotState } from "./restorePot.js";

/**
 * Ties together the save flow:
 *  - Export: capture state -> save to booth server -> build poster (with the
 *    pot at the user's chosen angle + the save code) -> upload photo -> show
 *    the download QR + code to the student.
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
    onRestore,
    boothLabel = "Exhibition",
  } = options;

  return {
    async exportCurrentWork() {
      const angle = getCameraAngle();

      const state = capturePotState(geometry);

      const { id } = await createSave({ ...state, angle });

      const poster = await renderPoster({
        renderer,
        scene,
        camera,
        id,
        boothLabel,
      });

      await uploadPhoto(id, poster);

      showSaveExport({ id });

      return id;
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