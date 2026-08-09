import QRCode from "qrcode";

let cachedBaseUrl = null;
let baseUrlPromise = null;

// Resolves the LAN base URL served by the booth (e.g.
// http://192.168.1.7:5173/). Falls back to the page origin if the dev
// endpoint is unavailable (vite preview / static hosting).
async function getBaseUrl() {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  if (!baseUrlPromise) {
    baseUrlPromise = (async () => {
      try {
        const res = await fetch("/api/base-url");
        if (res.ok) {
          const data = await res.json();
          if (data && data.baseUrl) {
            cachedBaseUrl = data.baseUrl;
            return cachedBaseUrl;
          }
        }
      } catch {
        // fall through to page origin
      }

      cachedBaseUrl = `${window.location.origin}/`;
      return cachedBaseUrl;
    })();
  }

  return baseUrlPromise;
}

// The export QR encodes the URL students open on their phone to download
// the poster of their work. Uses the booth's LAN address so it works from
// any student device on the same network, regardless of how the booth PC
// page itself was opened (localhost vs LAN IP).
export async function makeSaveUrl(path) {
  const baseUrl = await getBaseUrl();
  return new URL(path, baseUrl).toString();
}

export function encodeToDataURL(text, options = {}) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    ...options,
  });
}