import authApi from "../api/authApi";
import { extractApiPayload } from "../utils/api";

export const login = async (username, password) => {
  const response = await authApi.post("/login", { username, password });
  return extractApiPayload(response);
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  const response = await authApi.post("/logout", { refreshToken });
  return extractApiPayload(response);
};

export const refreshToken = async (refresh_token) => {
  const token = refresh_token || localStorage.getItem("refresh_token");
  const response = await authApi.post("/refresh", {
    refreshToken: token,
  });
  return extractApiPayload(response);
};

export const cambiarPassword = async (data) => {
  const response = await authApi.post("/cambiar-password", data);
  return extractApiPayload(response);
};
