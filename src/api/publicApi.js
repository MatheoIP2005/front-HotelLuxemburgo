import { PUBLIC_API_BASE_URL } from "./apiConfig";
import { createHttpClient } from "../shared/api/httpClient";

const publicApi = createHttpClient({
  baseURL: PUBLIC_API_BASE_URL,
});

export default publicApi;
