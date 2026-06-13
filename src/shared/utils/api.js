export const extractApiPayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

export const extractApiErrorMessage = (err, fallback = "Ocurrió un error inesperado.") => {
  let apiError = err?.response?.data;

  if (typeof apiError === "string") {
    try {
      apiError = JSON.parse(apiError);
    } catch {
      return apiError.trim() || fallback;
    }
  }

  if (apiError?.data && typeof apiError.data === "object") {
    apiError = apiError.data;
  }

  const details =
    apiError?.details ?? apiError?.Details ?? apiError?.errors ?? apiError?.Errors;

  if (Array.isArray(details) && details.length > 0) {
    const title = apiError?.message || apiError?.error || apiError?.Error;
    const genericTitles = new Set([
      "conflicto",
      "conflict",
      "solicitud invalida",
      "no encontrado",
      "error interno del servidor",
    ]);
    if (title && !genericTitles.has(String(title).toLowerCase())) {
      return `${title}: ${details.join(" | ")}`;
    }
    return details.join(" | ");
  }

  const explicit =
    apiError?.message || apiError?.error || apiError?.Error || apiError?.title;

  if (explicit) {
    return explicit;
  }

  const axiosMessage = String(err?.message ?? "");
  if (/^Request failed with status code \d+$/i.test(axiosMessage)) {
    return fallback;
  }

  return axiosMessage || fallback;
};

export const extractApiList = (response) => {
  const payload = extractApiPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

export const normalizeCollectionPayload = (payload, fallback = {}) => {
  const source = payload ?? {};
  const items = Array.isArray(source)
    ? source
    : Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source?.results)
        ? source.results
        : Array.isArray(source?.data)
          ? source.data
          : [];

  const pagina = Number(
    source?.paginaActual ?? source?.pagina ?? fallback.pagina ?? 1
  );
  const defaultLimit = items.length > 0 ? items.length : 10;
  const limite = Number(source?.limite ?? fallback.limite ?? defaultLimit);
  const total = Number(
    source?.totalResultados ?? source?.total ?? fallback.total ?? items.length
  );
  const totalPaginas = Number(
    source?.totalPaginas ??
      fallback.totalPaginas ??
      (limite > 0 ? Math.max(1, Math.ceil(total / limite)) : 1)
  );

  return {
    items,
    pagina,
    limite,
    total,
    totalPaginas,
  };
};
