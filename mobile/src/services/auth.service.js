import authApi from "../api/authApi";
import { extractApiPayload } from "../../../src/shared/utils/api";
import { mobileAuthStorage } from "../platform/mobileAuthStorage";

export const login = async (username, password) => {
  const response = await authApi.post(
    "/login",
    { username, password },
    { skipAuthRedirect: true }
  );
  return extractApiPayload(response);
};

export const logout = async () => {
  const refreshToken = await mobileAuthStorage.getRefreshToken();
  const response = await authApi.post(
    "/logout",
    { refreshToken },
    { skipAuthRedirect: true }
  );
  return extractApiPayload(response);
};

export const cambiarPassword = async (data) => {
  const response = await authApi.post("/cambiar-password", {
    passwordActual: data.passwordActual,
    passwordNuevo: data.passwordNuevo,
  });
  return extractApiPayload(response);
};
