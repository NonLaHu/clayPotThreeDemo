import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SAVE_DIR = path.resolve(process.cwd(), "saves");

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
      img { max-width: min(90vw, 480px); border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
      h1 { font-size: 20px; font-weight: 600; }
      a.download {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 30px;
        background: linear-gradient(135deg, #8b5a2b 0%, #6b4423 100%);
        color: #fff8dc;
        text-decoration: none;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(107, 68, 35, .4);
      }
      p.hint { font-size: 13px; color: #b9a98c; text-align: center; max-width: 340px; }
    </style>
  </head>
  <body>
    <h1>Your clay pot</h1>
    <img src="${photoUrl}" alt="Your clay pot" />
    <a class="download" href="${photoUrl}" download="clay-pot-${id}.png">Save photo</a>
    <p class="hint">Save the photo to your device, then show the small QR code at its corner to the booth webcam to reload your pot.</p>
  </body>
</html>`;

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
          return;
        }

        next();
      });
    },
  };
}