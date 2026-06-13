import { createAuthenticatedHttpClient } from "../../../src/shared/api/httpClient";
import { AUTH_API_BASE_URL } from "../config/env";
import { mobileAuthStorage } from "../platform/mobileAuthStorage";
import { handleUnauthorized, registerUnauthorizedHandler } from "./unauthorized";

export const setAuthUnauthorizedHandler = registerUnauthorizedHandler;

const authApi = createAuthenticatedHttpClient({
  baseURL: AUTH_API_BASE_URL || undefined,
  tokenStorage: mobileAuthStorage,
  onUnauthorized: async () => {
    await mobileAuthStorage.clearSession();
    await handleUnauthorized();
  },
});

export default authApi;
