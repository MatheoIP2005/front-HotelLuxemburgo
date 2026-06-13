import { AUTH_API_BASE_URL } from "./apiConfig";
import { createAuthenticatedHttpClient } from "../shared/api/httpClient";
import { webAuthStorage } from "../platform/webAuthStorage";

const authApi = createAuthenticatedHttpClient({
  baseURL: AUTH_API_BASE_URL,
  tokenStorage: webAuthStorage,
  onUnauthorized: async () => {
    await webAuthStorage.clearAll();
    window.location.href = "/admin/login";
  },
});

export default authApi;
