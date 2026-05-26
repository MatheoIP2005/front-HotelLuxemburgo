import { createContext, useEffect, useState } from "react";
import { login, logout } from "../services/auth.service";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const clearAuthStorage = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
  };

  const parseJwtPayload = (token) => {
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(normalized);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  const normalizeRole = (value) => String(value || "").toUpperCase().trim();

  const ADMIN_ROLE_CANDIDATES = new Set([
    "ADMIN",
    "ADMINISTRADOR",
    "ROLE_ADMIN",
    "ROLE_ADMINISTRADOR",
  ]);

  const extractRoleCandidates = (source) => {
    const values = [];

    const walk = (node) => {
      if (!node) return;

      if (typeof node === "string") {
        values.push(node);
        return;
      }

      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }

      if (typeof node === "object") {
        const possibleKeys = [
          "rol",
          "role",
          "roles",
          "nombre_rol",
          "tipo_rol",
          "authorities",
          "perfiles",
          "perfil",
          "scope",
          "scp",
        ];

        possibleKeys.forEach((key) => {
          if (key in node) walk(node[key]);
        });
      }
    };

    walk(source);
    return values.map(normalizeRole);
  };

  const hasAdminRole = (userData, accessToken) => {
    const userCandidates = extractRoleCandidates(userData);
    if (userCandidates.some((role) => ADMIN_ROLE_CANDIDATES.has(role))) return true;

    const tokenPayload = parseJwtPayload(accessToken);
    const tokenCandidates = extractRoleCandidates(tokenPayload);
    if (tokenCandidates.some((role) => ADMIN_ROLE_CANDIDATES.has(role))) return true;

    return false;
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isAuthenticated = Boolean(user && localStorage.getItem("access_token"));
  const isAdmin = isAuthenticated && hasAdminRole(user, localStorage.getItem("access_token"));

  useEffect(() => {
    // Siempre inicia sin sesion para forzar credenciales al levantar el front.
    clearAuthStorage();
    setUser(null);
  }, []);

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await login(username, password);
      const accessToken = response?.token ?? response?.access_token ?? null;
      const refreshToken = response?.refreshToken ?? response?.refresh_token ?? null;
      const userData = response
        ? {
            usuarioGuid: response.usuarioGuid ?? response.usuario_guid ?? null,
            username: response.username ?? username,
            correo: response.email ?? response.correo ?? null,
            roles: response.roles ?? [],
          }
        : null;

      if (!accessToken || !hasAdminRole(userData, accessToken)) {
        clearAuthStorage();
        setUser(null);
        setError("Acceso denegado: solo ADMINISTRADOR puede ingresar.");
        return false;
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken ?? "");
      const normalizedUserData = userData ?? { username };
      localStorage.setItem("user_data", JSON.stringify(normalizedUserData));

      setUser(normalizedUserData);
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Error al iniciar sesion";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
