import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteCliente,
  getClientes,
  inhabilitarCliente,
} from "../services/clientes.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useClientes() {
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
      const response = await getClientes({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, {
        pagina: 1,
        limite: 10,
      });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteCliente(id);
    await fetchData(lastQueryRef.current);
  };

  const handleInhabilitar = async (id, motivo) => {
    await inhabilitarCliente(id, motivo);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    clientes: data,
    loading,
    error,
    pagination,
    fetchClientes: fetchData,
    handleDelete,
    handleInhabilitar,
  };
}
