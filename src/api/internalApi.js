import axios from "axios";
import { INTERNAL_API_BASE_URL } from "./apiConfig";

const internalApi = axios.create({
  baseURL: INTERNAL_API_BASE_URL,
});

internalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

internalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

export default internalApi;
