import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteCatalogoItem,
  desactivarCatalogoItem,
  getCatalogo,
} from "../services/catalogoServicios.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useCatalogoServicios() {
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
      const response = await getCatalogo({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar catálogo de servicios");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteCatalogoItem(id);
    await fetchData(lastQueryRef.current);
  };

  const handleDesactivar = async (id) => {
    await desactivarCatalogoItem(id);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    catalogo: data,
    loading,
    error,
    pagination,
    fetchCatalogo: fetchData,
    handleDelete,
    handleDesactivar,
  };
}
