import { defineConfig } from "vite";

import { saveServerPlugin } from "./vite-save-plugin.js";

export default defineConfig({
  plugins: [saveServerPlugin()],

  server: {
    host: true,
  },
});