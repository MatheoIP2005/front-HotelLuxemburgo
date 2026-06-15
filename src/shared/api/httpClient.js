import axios from "axios";

const DEFAULT_RATE_LIMIT_RETRY_MS = 30000;
const DEFAULT_RATE_LIMIT_RETRY_METHODS = ["get"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRateLimitRetryDelayMs = (headers = {}) => {
  const retryAfter = headers["retry-after"];
  if (!retryAfter) return DEFAULT_RATE_LIMIT_RETRY_MS;

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (Number.isFinite(retryAfterDate)) {
    return Math.max(retryAfterDate - Date.now(), DEFAULT_RATE_LIMIT_RETRY_MS);
  }

  return DEFAULT_RATE_LIMIT_RETRY_MS;
};

const shouldRetryRateLimitedRequest = (error) => {
  const config = error?.config;
  const method = String(config?.method ?? "get").toLowerCase();
  const retryCount = Number(config?._rateLimitRetryCount ?? 0);
  const retryMethods = Array.isArray(config?.retryRateLimitMethods)
    ? config.retryRateLimitMethods
    : DEFAULT_RATE_LIMIT_RETRY_METHODS;
  const retryLimit = Number(config?.rateLimitMaxRetries ?? 1);

  return (
    error?.response?.status === 429 &&
    retryMethods.map((item) => String(item).toLowerCase()).includes(method) &&
    config?.retryOnRateLimit !== false &&
    retryCount < retryLimit
  );
};

export const createHttpClient = ({ baseURL } = {}) => {
  const client = axios.create({
    baseURL,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!shouldRetryRateLimitedRequest(error)) {
        return Promise.reject(error);
      }

      const config = error.config;
      config._rateLimitRetryCount = Number(config._rateLimitRetryCount ?? 0) + 1;
      await sleep(getRateLimitRetryDelayMs(error.response?.headers));
      return client.request(config);
    }
  );

  return client;
};

export const createAuthenticatedHttpClient = ({
  baseURL,
  tokenStorage,
  onUnauthorized,
} = {}) => {
  const client = createHttpClient({ baseURL });

  client.interceptors.request.use(
    async (config) => {
      const token = await tokenStorage?.getAccessToken?.();

      if (token && !config.headers?.Authorization) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error?.response?.status === 401 && !error?.config?.skipAuthRedirect) {
        await onUnauthorized?.(error);
      }

      return Promise.reject(error);
    }
  );

  return client;
};
