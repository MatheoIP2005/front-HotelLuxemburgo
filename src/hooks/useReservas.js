import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelarReserva,
  confirmarReserva,
  getReservas,
} from "../services/reservas.service";
import { extractApiErrorMessage, normalizeCollectionPayload } from "../utils/api";

export default function useReservas() {
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
  const getErrorMessage = (err) =>
    extractApiErrorMessage(err, "Error al cargar reservas");

  const fetchData = useCallback(async (params = {}) => {
    lastQueryRef.current = params;
    setLoading(true);
    setError(null);
    try {
      const response = await getReservas(params);
      const collection = normalizeCollectionPayload(response, {
        pagina: Number(params?.pagina) || 1,
        limite: Number(params?.limite) || 10,
      });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirmar = async (id) => {
    await confirmarReserva(id);
    await fetchData(lastQueryRef.current);
  };

  const handleCancelar = async (id, motivo) => {
    await cancelarReserva(id, motivo);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    reservas: data,
    loading,
    error,
    pagination,
    fetchReservas: fetchData,
    handleConfirmar,
    handleCancelar,
  };
}
