/* global process */

import Constants from "expo-constants";
import { Platform } from "react-native";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
const processEnv =
  typeof process !== "undefined" && process.env
    ? process.env.EXPO_PUBLIC_API_BASE_URL
    : "";

export const API_BASE_URL = trimTrailingSlash(
  processEnv || expoExtra.apiBaseUrl || ""
);

export const AUTH_API_BASE_URL = API_BASE_URL ? `${API_BASE_URL}/auth` : "";
export const INTERNAL_API_BASE_URL = API_BASE_URL
  ? `${API_BASE_URL}/internal`
  : "";

export const isApiConfigured = Boolean(API_BASE_URL);

const getPlatformHint = () => {
  if (Platform.OS === "android") {
    return "Emulador Android: $env:EXPO_PUBLIC_API_BASE_URL=\"http://10.0.2.2:5000/api/v1\"";
  }

  if (Platform.OS === "ios") {
    return "Simulador iOS: $env:EXPO_PUBLIC_API_BASE_URL=\"http://127.0.0.1:5000/api/v1\"";
  }

  return "Celular fisico: usa la IP LAN de tu PC, p. ej. http://192.168.1.20:5000/api/v1";
};

export const API_CONFIG_WARNING = isApiConfigured
  ? ""
  : `Falta EXPO_PUBLIC_API_BASE_URL (Gateway /api/v1). ${getPlatformHint()}`;

if (!isApiConfigured) {
  console.warn(API_CONFIG_WARNING);
}
