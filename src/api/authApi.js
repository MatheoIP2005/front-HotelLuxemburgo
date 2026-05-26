import axios from "axios";
import { AUTH_API_BASE_URL } from "./apiConfig";

const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
});

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

export default authApi;
