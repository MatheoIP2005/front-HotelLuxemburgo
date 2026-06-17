/* global require, __dirname, module */

const path = require("path");
const { createReadStream, existsSync } = require("fs");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const imagenesRoot = path.resolve(workspaceRoot, "imagenes");

const MIME_TYPES = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    const requestPath = decodeURIComponent(String(req.url ?? "").split("?")[0]);

    if (!requestPath.startsWith("/imagenes/")) {
      return middleware(req, res, next);
    }

    const relativePath = requestPath.replace(/^\/imagenes\/?/, "");
    const filePath = path.resolve(imagenesRoot, relativePath);

    if (!filePath.startsWith(imagenesRoot) || !existsSync(filePath)) {
      return middleware(req, res, next);
    }

    const extension = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
    createReadStream(filePath).pipe(res);
  },
};

module.exports = config;
