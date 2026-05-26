const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const rawApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");

if (!rawApiBaseUrl) {
  console.warn(
    "VITE_API_BASE_URL no esta configurada. Define la URL publica del Gateway antes de desplegar."
  );
}

export const API_BASE_URL = rawApiBaseUrl;
export const PUBLIC_API_BASE_URL = API_BASE_URL || undefined;
export const INTERNAL_API_BASE_URL = API_BASE_URL
  ? `${API_BASE_URL}/internal`
  : undefined;
export const AUTH_API_BASE_URL = API_BASE_URL ? `${API_BASE_URL}/auth` : undefined;
