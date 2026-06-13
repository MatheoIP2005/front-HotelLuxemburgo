const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";

const getStorage = () =>
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : null;

const getItem = async (key) => getStorage()?.getItem(key) ?? null;

const setItem = async (key, value) => {
  getStorage()?.setItem(key, value ?? "");
};

const removeItem = async (key) => {
  getStorage()?.removeItem(key);
};

export const webAuthStorage = {
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
    getStorage()?.clear();
  },
};
