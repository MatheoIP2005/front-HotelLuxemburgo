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
  const renderGateway =
    'EXPO_PUBLIC_API_BASE_URL="https://hotellux-gateway.onrender.com/api/v1"';

  if (Platform.OS === "android" || Platform.OS === "ios") {
    return `Usa el Gateway publico de Render: ${renderGateway}`;
  }

  return `Define ${renderGateway}`;
};

export const API_CONFIG_WARNING = isApiConfigured
  ? ""
  : `Falta EXPO_PUBLIC_API_BASE_URL (Gateway /api/v1). ${getPlatformHint()}`;

if (!isApiConfigured) {
  console.warn(API_CONFIG_WARNING);
}
