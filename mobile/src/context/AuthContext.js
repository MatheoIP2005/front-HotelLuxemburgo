import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setAuthUnauthorizedHandler } from "../api/authApi";
import { resetToLogin } from "../navigation/navigationRef";
import { login as loginRequest, logout as logoutRequest } from "../services/auth.service";
import { mobileAuthStorage } from "../platform/mobileAuthStorage";
import { extractApiErrorMessage } from "../../../src/shared/utils/api";
import { hasAdminRole, normalizeLoginUser } from "../utils/auth";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearSession = useCallback(async () => {
    await mobileAuthStorage.clearSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const [token, storedUser] = await Promise.all([
          mobileAuthStorage.getAccessToken(),
          mobileAuthStorage.getUserData(),
        ]);

        if (!mounted) return;

        if (token && storedUser && hasAdminRole(storedUser, token)) {
          setAccessToken(token);
          setUser(storedUser);
        } else if (token || storedUser) {
          await mobileAuthStorage.clearSession();
        }
      } finally {
        if (mounted) setBootstrapping(false);
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setAuthUnauthorizedHandler(async () => {
      await clearSession();
      resetToLogin();
    });
  }, [clearSession]);

  const handleLogin = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginRequest(username, password);
      const token = response?.token ?? response?.access_token ?? null;
      const refreshToken = response?.refreshToken ?? response?.refresh_token ?? null;
      const userData = normalizeLoginUser(response, username);

      if (!token || !hasAdminRole(userData, token)) {
        await clearSession();
        setError("Acceso denegado: solo ADMINISTRADOR puede ingresar.");
        return false;
      }

      await mobileAuthStorage.setSession({
        accessToken: token,
        refreshToken,
        userData,
      });
      setAccessToken(token);
      setUser(userData);
      return true;
    } catch (err) {
      setError(extractApiErrorMessage(err, "Error al iniciar sesion."));
      return false;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await logoutRequest();
    } catch {
      // Si el backend no responde, igual limpiamos la sesion local.
    } finally {
      await clearSession();
      setLoading(false);
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      bootstrapping,
      loading,
      error,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: Boolean(user && accessToken && hasAdminRole(user, accessToken)),
      handleLogin,
      handleLogout,
      clearSession,
    }),
    [user, accessToken, bootstrapping, loading, error, handleLogin, handleLogout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
};
