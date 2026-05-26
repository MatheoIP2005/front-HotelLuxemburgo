import { useCallback, useEffect, useRef, useState } from "react";
import { aprobarPago, getPagos, updateEstadoPago } from "../services/pagos.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function usePagos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const lastQueryRef = useRef(null);

  const fetchData = useCallback(async (params = {}) => {
    lastQueryRef.current = params;
    setLoading(true);
    setError(null);
    try {
      const response = await getPagos(params);
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateEstado = async (id, estado) => {
    await updateEstadoPago(id, estado);
    await fetchData(lastQueryRef.current ?? {});
  };

  const handleAprobar = async (id) => {
    await aprobarPago(id);
    await fetchData(lastQueryRef.current ?? {});
  };

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  return {
    pagos: data,
    loading,
    error,
    pagination,
    fetchPagos: fetchData,
    handleAprobar,
    handleUpdateEstado,
  };
}
