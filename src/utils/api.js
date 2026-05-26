export const extractApiPayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

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
