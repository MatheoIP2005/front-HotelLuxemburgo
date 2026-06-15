/* global process */

import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_BASE_URL } from "./env";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const fromEnv =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_IMAGES_BASE_URL) ||
  expoExtra.imagesBaseUrl ||
  "";

export const getImagesBaseUrl = () => {
  if (fromEnv) return trimTrailingSlash(fromEnv);

  if (!API_BASE_URL) return "";

  try {
    const apiUrl = new URL(API_BASE_URL);
    if (apiUrl.hostname === "10.0.2.2") {
      apiUrl.hostname = "10.0.2.2";
      apiUrl.port = "5173";
    } else if (apiUrl.hostname === "127.0.0.1" || apiUrl.hostname === "localhost") {
      apiUrl.port = "5173";
    } else {
      apiUrl.port = "5173";
    }
    apiUrl.pathname = "";
    apiUrl.search = "";
    apiUrl.hash = "";
    return trimTrailingSlash(apiUrl.toString());
  } catch {
    return "";
  }
};

export const getImagesConfigHint = () => {
  if (getImagesBaseUrl()) return "";

  if (Platform.OS === "android") {
    return 'Define EXPO_PUBLIC_IMAGES_BASE_URL="http://10.0.2.2:5173" con Vite en marcha.';
  }

  if (Platform.OS === "ios") {
    return 'Define EXPO_PUBLIC_IMAGES_BASE_URL="http://127.0.0.1:5173" con Vite en marcha.';
  }

  return 'Define EXPO_PUBLIC_IMAGES_BASE_URL apuntando al servidor web que sirve /imagenes.';
};
