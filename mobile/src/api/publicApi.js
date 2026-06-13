import { createHttpClient } from "../../../src/shared/api/httpClient";
import { API_BASE_URL } from "../config/env";

const publicApi = createHttpClient({
  baseURL: API_BASE_URL || undefined,
});

export default publicApi;
