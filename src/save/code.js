// Helpers for the human-friendly save code shown on the poster / overlay and
// typed back into the "Load Progress" prompt.
//
// Save ids are 8 lowercase hex chars on the server (e.g. "ab12cd34"). We
// display them grouped + uppercase ("AB12 CD34") and normalize any typed input
// back to the stored lowercase form before looking the save up.

export function formatSaveCode(id) {
  return (id || "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function normalizeSaveCode(input) {
  return (input || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function codeToId(input) {
  return normalizeSaveCode(input).toLowerCase();
}
