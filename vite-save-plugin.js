import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SAVE_DIR = path.resolve(process.cwd(), "saves");
const THREE_BUILD_DIR = path.resolve(process.cwd(), "node_modules/three/build");
const THREE_GLTF_DIR = path.resolve(process.cwd(), "node_modules/three/examples/jsm/exporters");
const VIEWER_DIR = path.resolve(process.cwd(), "server");

function ensureSaveDir() {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

function sendJSON(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function saveServerPlugin() {
  return {
    name: "clay-pot-save-server",

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || "").split("?")[0];

        // ------------------------------------------------------------
        // GET /api/base-url -> LAN base URL (used for save QR codes so
        // students on the same network can reach the booth, even when the
        // booth page itself is opened on localhost).
        // ------------------------------------------------------------
        if (req.method === "GET" && url === "/api/base-url") {
          const network = server.resolvedUrls?.network?.[0];
          const local = server.resolvedUrls?.local?.[0];
          const baseUrl = network || local || `http://localhost:${server.config.server.port || 5173}/`;

          sendJSON(res, 200, { baseUrl });
          return;
        }

        // ------------------------------------------------------------
        // POST /api/saves          -> create a save record
        // ------------------------------------------------------------
        if (req.method === "POST" && url === "/api/saves") {
          ensureSaveDir();

          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              const id =
                typeof data.id === "string" && data.id
                  ? data.id
                  : crypto.randomBytes(4).toString("hex");

              const source = JSON.parse(body);
              const { id: _ignored, ...rest } = source;

              const record = {
                id,
                createdAt: Date.now(),
                ...rest,
              };

              fs.writeFileSync(
                path.join(SAVE_DIR, `${id}.json`),
                JSON.stringify(record),
              );

              sendJSON(res, 200, { id });
            } catch (error) {
              sendJSON(res, 500, { error: String(error && error.message) });
            }
          });
          return;
        }

        // ------------------------------------------------------------
        // GET /api/saves/:id       -> fetch a save record
        // ------------------------------------------------------------
        const saveMatch = url.match(/^\/api\/saves\/([A-Za-z0-9]+)$/);
        if (req.method === "GET" && saveMatch) {
          ensureSaveDir();
          const id = saveMatch[1];
          const file = path.join(SAVE_DIR, `${id}.json`);

          if (!fs.existsSync(file)) {
            sendJSON(res, 404, { error: "save not found" });
            return;
          }

          sendJSON(res, 200, JSON.parse(fs.readFileSync(file, "utf8")));
          return;
        }

        // ------------------------------------------------------------
        // POST /api/saves/:id/photo -> store the rendered PNG
        // body: { png: "<dataURL>" }
        // ------------------------------------------------------------
        const photoMatch = url.match(/^\/api\/saves\/([A-Za-z0-9]+)\/photo$/);
        if (req.method === "POST" && photoMatch) {
          ensureSaveDir();

          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              if (typeof data.png !== "string") {
                sendJSON(res, 400, { error: "missing png" });
                return;
              }

              const base64 = data.png.replace(/^data:image\/\w+;base64,/, "");
              fs.writeFileSync(
                path.join(SAVE_DIR, `${photoMatch[1]}.png`),
                Buffer.from(base64, "base64"),
              );

              sendJSON(res, 200, { ok: true });
            } catch (error) {
              sendJSON(res, 500, { error: String(error?.message) });
            }
          });
          return;
        }

        // ------------------------------------------------------------
        // GET /s/:id/photo.png     -> the saved poster image
        // ------------------------------------------------------------
        const photonServerMatch = url.match(/^\/s\/([A-Za-z0-9]+)\/photo\.png$/);
        if (req.method === "GET" && photonServerMatch) {
          ensureSaveDir();
          const file = path.join(SAVE_DIR, `${photonServerMatch[1]}.png`);

          if (!fs.existsSync(file)) {
            res.statusCode = 404;
            res.end("not found");
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.end(fs.readFileSync(file));
          return;
        }

        // ------------------------------------------------------------
        // GET /s/<id> -> simple page for the student's phone
        // ------------------------------------------------------------
        const pageMatch = url.match(/^\/s\/([A-Za-z0-9]+)$/);
        if (req.method === "GET" && pageMatch) {
          ensureSaveDir();
          const id = pageMatch[1];
          const jsonFile = path.join(SAVE_DIR, `${id}.json`);

          if (!fs.existsSync(jsonFile)) {
            res.statusCode = 404;
            res.end("save not found");
            return;
          }

          const photoUrl = `/s/${id}/photo.png`;
          const saveData = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
          const saveJson = JSON.stringify(saveData)
            .replace(/</g, "\\u003c")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");
          const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Clay Pot</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #1a1510;
        color: #fff8dc;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 20px;
      }
      h1 { font-size: 20px; font-weight: 600; }
      .viewer {
        position: relative;
        width: min(90vw, 480px);
        height: min(70vh, 480px);
        border-radius: 12px;
        overflow: hidden;
        background: #241c15;
        box-shadow: 0 12px 40px rgba(0,0,0,.5);
        touch-action: none;
      }
      .viewer canvas { width: 100%; height: 100%; display: block; }
      .viewer-hint {
        position: absolute; top: 10px; left: 0; right: 0;
        text-align: center; pointer-events: none;
        font-size: 12px; color: #b9a98c;
      }
      .actions {
        display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
      }
      a.download, button.download {
        border: none; cursor: pointer;
        display: inline-block; padding: 14px 28px;
        border-radius: 30px;
        background: linear-gradient(135deg, #8b5a2b 0%, #6b4423 100%);
        color: #fff8dc;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 4px 15px rgba(107, 68, 35, .4);
      }
      p.hint { font-size: 13px; color: #b9a98c; text-align: center; max-width: 340px; }
      .dims {
        display: flex; gap: 10px; flex-wrap: wrap;
        justify-content: center; align-items: center;
        font-size: 13px; color: #fff8dc;
      }
      .dims .dim-label { color: #b9a98c; text-transform: uppercase;
        font-size: 10px; letter-spacing: .6px; }
      .dim-row {
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        padding: 8px 16px; border-radius: 12px;
        background: rgba(255,248,220,.05);
        border: 1px solid rgba(255,248,220,.12);
        min-width: 96px;
      }
      .dim-value { font-weight: 700; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>Your clay pot</h1>
    <div class="viewer">
      <canvas id="viewer-canvas"></canvas>
      <div class="viewer-hint">Drag to rotate · scroll to zoom</div>
    </div>
    <div class="actions">
      <button class="download" id="dl-glb" type="button">Download 3D model (GLB)</button>
      <a class="download" href="${photoUrl}" download="clay-pot-${id}.png">Save photo</a>
    </div>
    <div class="dims" id="pot-dims">
      <div class="dim-row"><span class="dim-label">Height</span><span class="dim-value" id="dim-height">–</span></div>
      <div class="dim-row"><span class="dim-label">Max Ø</span><span class="dim-value" id="dim-width">–</span></div>
      <div class="dim-row"><span class="dim-label">Base Ø</span><span class="dim-value" id="dim-base">–</span></div>
      <div class="dim-row"><span class="dim-label">Rim Ø</span><span class="dim-value" id="dim-rim">–</span></div>
    </div>
    <p class="hint">Drag the pot around, grab the 3D model, or save the photo. The small QR code at the poster's corner reloads your pot at the booth.</p>
    <script id="save-data" type="application/json">${saveJson}</script>
    <script type="module" src="/3d/viewer.js"></script>
  </body>
</html>`;

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
          return;
        }

        // ------------------------------------------------------------
        // 3D viewer static assets
        // ------------------------------------------------------------
        if (req.method === "GET" && url === "/3d/three.module.js") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/javascript");
          res.end(fs.readFileSync(path.join(THREE_BUILD_DIR, "three.module.js")));
          return;
        }

        if (req.method === "GET" && url === "/3d/three.core.js") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/javascript");
          res.end(fs.readFileSync(path.join(THREE_BUILD_DIR, "three.core.js")));
          return;
        }

        if (req.method === "GET" && url === "/3d/GLTFExporter.js") {
          const src = fs.readFileSync(
            path.join(THREE_GLTF_DIR, "GLTFExporter.js"),
            "utf8",
          );

          // The exporter imports the bare "three" specifier; rewrite it to the
          // absolute module we serve so the browser can resolve it.
          const rewritten = src.replace(/\bfrom\s+['"]three['"]\s*;/, "from '/3d/three.module.js';");

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/javascript");
          res.end(rewritten);
          return;
        }

        if (req.method === "GET" && url === "/3d/viewer.js") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/javascript");
          res.end(fs.readFileSync(path.join(VIEWER_DIR, "viewer.js")));
          return;
        }

        next();
      });
    },
  };
}