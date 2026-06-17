import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const imagenesDir = resolve(rootDir, "imagenes");

const MIME_TYPES = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

function imagenesStaticPlugin() {
  return {
    name: "hotel-luxemburgo-imagenes",
    configureServer(server) {
      server.middlewares.use("/imagenes", (req, res, next) => {
        const requestPath = decodeURIComponent((req.url ?? "").split("?")[0] || "");
        const relativePath = requestPath.replace(/^\/+/, "");
        const filePath = resolve(imagenesDir, relativePath);

        if (!filePath.startsWith(imagenesDir) || !existsSync(filePath)) {
          next();
          return;
        }

        const extension = requestPath.slice(requestPath.lastIndexOf(".")).toLowerCase();
        res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
        createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (!existsSync(imagenesDir)) return;
      cpSync(imagenesDir, resolve(rootDir, "dist", "imagenes"), { recursive: true });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imagenesStaticPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
