import { useCallback, useEffect, useRef, useState } from "react";
import {
  addCargoEstadia,
  getEstadias,
  getCargosEstadia,
  hacerCheckin,
  hacerCheckout,
} from "../services/estadias.service";
import { normalizeCollectionPayload } from "../utils/api";

export default function useEstadias() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [cargosLoading, setCargosLoading] = useState(false);
  const [selectedEstadiaGuid, setSelectedEstadiaGuid] = useState(null);
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
      const response = await getEstadias({ pagina: 1, limite: 10, ...params });
      const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 10 });
      setData(collection.items);
      setPagination({
        pagina: collection.pagina,
        limite: collection.limite,
        total: collection.total,
        totalPaginas: collection.totalPaginas,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar estadías");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckin = async (idReserva, payload) => {
    await hacerCheckin(idReserva, payload);
    await fetchData(lastQueryRef.current);
  };

  const handleCheckout = async (id, payload) => {
    await hacerCheckout(id, payload);
    await fetchData(lastQueryRef.current);
  };

  const fetchCargos = async (estadiaGuid) => {
    setCargosLoading(true);
    try {
      const response = await getCargosEstadia(estadiaGuid);
      setSelectedEstadiaGuid(estadiaGuid);
      setCargos(Array.isArray(response) ? response : []);
    } finally {
      setCargosLoading(false);
    }
  };

  const handleAddCargo = async (estadiaGuid, payload) => {
    await addCargoEstadia(estadiaGuid, payload);
    await fetchCargos(estadiaGuid);
    await fetchData(lastQueryRef.current);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    estadias: data,
    cargos,
    cargosLoading,
    selectedEstadiaGuid,
    loading,
    error,
    pagination,
    fetchEstadias: fetchData,
    fetchCargos,
    handleCheckin,
    handleCheckout,
    handleAddCargo,
  };
}
