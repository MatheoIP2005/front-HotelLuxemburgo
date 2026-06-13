import axios from "axios";

export const createHttpClient = ({ baseURL } = {}) =>
  axios.create({
    baseURL,
  });

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
