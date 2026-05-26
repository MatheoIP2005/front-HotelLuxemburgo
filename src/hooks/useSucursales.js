import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteSucursal,
  getSucursales,
  inhabilitarSucursal,
} from "../services/sucursales.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const lastQueryRef = useRef({});

  const fetchSucursales = useCallback(async (params = {}) => {
    lastQueryRef.current = params;
    setLoading(true);
    setError(null);

    try {
      const response = await getSucursales({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setSucursales(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Error al cargar sucursales";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteSucursal(id);
    await fetchSucursales(lastQueryRef.current);
  };

  const handleInhabilitar = async (guid) => {
    await inhabilitarSucursal(guid);
    await fetchSucursales(lastQueryRef.current);
  };

  useEffect(() => {
    fetchSucursales();
  }, [fetchSucursales]);

  return {
    sucursales,
    loading,
    error,
    pagination,
    fetchSucursales,
    handleDelete,
    handleInhabilitar,
  };
}
