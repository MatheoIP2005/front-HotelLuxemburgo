import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteUsuario,
  getUsuarios,
  inhabilitarUsuario,
} from "../services/usuarios.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useUsuarios() {
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
      const response = await getUsuarios({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteUsuario(id);
    await fetchData(lastQueryRef.current);
  };

  const handleInhabilitar = async (id, motivo) => {
    await inhabilitarUsuario(id, motivo);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    usuarios: data,
    loading,
    error,
    pagination,
    fetchUsuarios: fetchData,
    handleDelete,
    handleInhabilitar,
  };
}
