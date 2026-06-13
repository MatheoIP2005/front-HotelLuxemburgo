import { createAuthenticatedHttpClient } from "../../../src/shared/api/httpClient";
import { INTERNAL_API_BASE_URL } from "../config/env";
import { mobileAuthStorage } from "../platform/mobileAuthStorage";
import { handleUnauthorized } from "./unauthorized";

const internalApi = createAuthenticatedHttpClient({
  baseURL: INTERNAL_API_BASE_URL || undefined,
  tokenStorage: mobileAuthStorage,
  onUnauthorized: async () => {
    await mobileAuthStorage.clearSession();
    await handleUnauthorized();
  },
});

export default internalApi;
