import authApi from "../api/authApi";
import { extractApiPayload } from "../utils/api";

const authenticate = async (username, password, config = {}) => {
  const response = await authApi.post("/login", { username, password }, config);
  return extractApiPayload(response);
};

export const login = async (username, password) => {
  return authenticate(username, password);
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  const response = await authApi.post("/logout", { refreshToken }, { skipAuthRedirect: true });
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

export const cambiarPasswordDesdeLogin = async ({
  username,
  passwordActual,
  passwordNuevo,
}) => {
  const authPayload = await authenticate(username, passwordActual, {
    skipAuthRedirect: true,
  });
  const accessToken = authPayload?.token ?? authPayload?.access_token ?? null;

  if (!accessToken) {
    throw new Error("No se pudo validar la sesion actual para cambiar la contraseña.");
  }

  const response = await authApi.post(
    "/cambiar-password",
    { passwordActual, passwordNuevo },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      skipAuthRedirect: true,
    }
  );

  return extractApiPayload(response);
};
