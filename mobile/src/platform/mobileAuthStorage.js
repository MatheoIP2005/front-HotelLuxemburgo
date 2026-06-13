import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";

const getItem = async (key) => {
  try {
    return (await SecureStore.getItemAsync(key)) ?? null;
  } catch {
    return null;
  }
};

const setItem = async (key, value) => {
  if (value === null || value === undefined || value === "") {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await SecureStore.setItemAsync(key, String(value));
};

const removeItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // SecureStore puede fallar si la clave no existe.
  }
};

export const mobileAuthStorage = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,

  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  getUserData: async () => {
    const raw = await getItem(USER_DATA_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession: async ({ accessToken, refreshToken, userData }) => {
    await setItem(ACCESS_TOKEN_KEY, accessToken);
    await setItem(REFRESH_TOKEN_KEY, refreshToken ?? "");
    await setItem(USER_DATA_KEY, JSON.stringify(userData ?? null));
  },

  clearSession: async () => {
    await removeItem(ACCESS_TOKEN_KEY);
    await removeItem(REFRESH_TOKEN_KEY);
    await removeItem(USER_DATA_KEY);
  },

  clearAll: async () => {
    await removeItem(ACCESS_TOKEN_KEY);
    await removeItem(REFRESH_TOKEN_KEY);
    await removeItem(USER_DATA_KEY);
  },
};
