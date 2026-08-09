async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`save request failed: ${res.status}`);
  }

  return res.json();
}

// Persists the save record to the booth server, returns { id }.
export function createSave(record) {
  return postJSON("/api/saves", record);
}

// Uploads the rendered poster photo, associating it with a save id.
export function uploadPhoto(id, pngDataUrl) {
  return postJSON(`/api/saves/${id}/photo`, { png: pngDataUrl });
}

// Fetches a save record (used when a scanned QR points at an existing save).
export async function fetchSave(id) {
  const res = await fetch(`/api/saves/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`save not found: ${id}`);
  }
  return res.json();
}