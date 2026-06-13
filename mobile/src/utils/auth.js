const ADMIN_ROLE_CANDIDATES = new Set([
  "ADMIN",
  "ADMINISTRADOR",
  "ROLE_ADMIN",
  "ROLE_ADMINISTRADOR",
]);

const normalizeRole = (value) => String(value || "").toUpperCase().trim();

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
      [
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
      ].forEach((key) => {
        if (key in node) walk(node[key]);
      });
    }
  };

  walk(source);
  return values.map(normalizeRole);
};

export const parseJwtPayload = (token) => {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof globalThis.atob === "function"
        ? globalThis.atob(normalized)
        : null;

    return decoded ? JSON.parse(decoded) : null;
  } catch {
    return null;
  }
};

export const hasAdminRole = (userData, accessToken) => {
  const userCandidates = extractRoleCandidates(userData);
  if (userCandidates.some((role) => ADMIN_ROLE_CANDIDATES.has(role))) {
    return true;
  }

  const tokenCandidates = extractRoleCandidates(parseJwtPayload(accessToken));
  return tokenCandidates.some((role) => ADMIN_ROLE_CANDIDATES.has(role));
};

export const normalizeLoginUser = (response, username) => ({
  usuarioGuid: response?.usuarioGuid ?? response?.usuario_guid ?? null,
  username: response?.username ?? username,
  correo: response?.email ?? response?.correo ?? null,
  roles: response?.roles ?? [],
});
