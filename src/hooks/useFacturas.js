import { useCallback, useEffect, useRef, useState } from "react";
import { anularFactura, getFacturas } from "../services/facturas.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useFacturas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const lastQueryRef = useRef({});

  const fetchData = useCallback(async (params = {}) => {
    lastQueryRef.current = params;
    setLoading(true);
    setError(null);
    try {
      const response = await getFacturas({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnular = async (id, motivo) => {
    await anularFactura(id, motivo);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    facturas: data,
    loading,
    error,
    pagination,
    fetchFacturas: fetchData,
    handleAnular,
  };
}
