/* global process */

import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_BASE_URL } from "./env";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");
const DEFAULT_VITE_PORT = "5173";

const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const fromEnv =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_IMAGES_BASE_URL) ||
  expoExtra.imagesBaseUrl ||
  "";

const getDebuggerHost = () => {
  const candidates = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
  ];

  for (const candidate of candidates) {
    const raw = String(candidate ?? "").trim();
    if (!raw) continue;

    const withoutScheme = raw.replace(/^exp:\/\//, "").split("/")[0];
    const hostPort = withoutScheme.split("?")[0];
    if (hostPort) return hostPort;
  }

  return "";
};

/** Base URL del packager Metro (Expo Go / dev). Sirve /imagenes vía metro.config.js */
export const getPackagerBaseUrl = () => {
  const hostPort = getDebuggerHost();
  if (!hostPort) return "";

  const [host, port = "8081"] = hostPort.split(":");
  if (!host) return "";

  return `http://${host}:${port}`;
};

const buildViteBaseFromApi = () => {
  if (!API_BASE_URL) return "";

  try {
    const apiUrl = new URL(API_BASE_URL);
    apiUrl.pathname = "";
    apiUrl.search = "";
    apiUrl.hash = "";
    apiUrl.port = DEFAULT_VITE_PORT;
    return trimTrailingSlash(apiUrl.toString());
  } catch {
    return "";
  }
};

/** Origen web desplegado (mismo host que el API sin /api/v1), p. ej. Vercel */
const buildWebOriginFromApi = () => {
  if (!API_BASE_URL) return "";

  try {
    const apiUrl = new URL(API_BASE_URL);
    apiUrl.pathname = apiUrl.pathname.replace(/\/api\/v\d+\/?$/i, "") || "/";
    if (apiUrl.pathname === "/") {
      apiUrl.pathname = "";
    }
    apiUrl.search = "";
    apiUrl.hash = "";
    return trimTrailingSlash(apiUrl.toString());
  } catch {
    return "";
  }
};

export const getImagesBaseUrl = () => {
  if (fromEnv) return trimTrailingSlash(fromEnv);

  const packagerBase = getPackagerBaseUrl();
  if (packagerBase) return packagerBase;

  const viteFromApi = buildViteBaseFromApi();
  if (viteFromApi) return viteFromApi;

  return buildWebOriginFromApi();
};

export const getImagesConfigHint = () => {
  if (getImagesBaseUrl()) return "";

  if (Platform.OS === "android") {
    return 'Define EXPO_PUBLIC_IMAGES_BASE_URL="http://10.0.2.2:5173" (Vite) o usa Expo Go con Metro en la misma red.';
  }

  if (Platform.OS === "ios") {
    return 'Define EXPO_PUBLIC_IMAGES_BASE_URL="http://127.0.0.1:5173" (Vite) o la URL web que sirve /imagenes.';
  }

  return 'Define EXPO_PUBLIC_IMAGES_BASE_URL apuntando al servidor que sirve /imagenes.';
};
