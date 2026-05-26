import { useCallback, useEffect, useRef, useState } from "react";
import {
  cambiarEstadoHabitacion,
  deleteHabitacion,
  getHabitaciones,
} from "../services/habitaciones.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useHabitaciones() {
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
      const response = await getHabitaciones({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar habitaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    await deleteHabitacion(id);
    await fetchData(lastQueryRef.current);
  };

  const handleCambiarEstado = async (id, estado) => {
    await cambiarEstadoHabitacion(id, estado);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    habitaciones: data,
    loading,
    error,
    pagination,
    fetchHabitaciones: fetchData,
    handleDelete,
    handleCambiarEstado,
  };
}
