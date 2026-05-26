import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteValoracion,
  getValoraciones,
  moderarValoracion,
} from "../services/valoraciones.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useValoraciones() {
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
      const response = await getValoraciones(params);
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar valoraciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteValoracion(id);
    await fetchData(lastQueryRef.current ?? {});
  };

  const handleModerar = async (id, payload) => {
    await moderarValoracion(id, payload);
    await fetchData(lastQueryRef.current ?? {});
  };

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  return {
    valoraciones: data,
    loading,
    error,
    pagination,
    fetchValoraciones: fetchData,
    handleDelete,
    handleModerar,
  };
}
