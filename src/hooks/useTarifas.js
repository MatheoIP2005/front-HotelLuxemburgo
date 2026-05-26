import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteTarifa,
  desactivarTarifa,
  getTarifas,
} from "../services/tarifas.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useTarifas() {
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
      const response = await getTarifas({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar tarifas");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteTarifa(id);
    await fetchData(lastQueryRef.current);
  };

  const handleDesactivar = async (id) => {
    await desactivarTarifa(id);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tarifas: data,
    loading,
    error,
    pagination,
    fetchTarifas: fetchData,
    handleDelete,
    handleDesactivar,
  };
}
