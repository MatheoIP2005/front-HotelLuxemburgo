import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  cambiarEstadoHabitacion,
  deleteHabitacion,
  getHabitaciones,
} from "../../services/habitaciones.service";
import { getSucursales } from "../../services/sucursales.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

const ESTADO_LABELS = {
  DIS: "Disponible",
  OCU: "Ocupada",
  MNT: "Mantenimiento",
  FDS: "Fuera de servicio",
  INA: "Inactiva",
};

export default function AdminHabitacionesScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const sucursalMap = useMemo(() => {
    const map = new Map();
    sucursales.forEach((s) => {
      const guid = pickGuid(s, "sucursalGuid", "sucursal_guid");
      if (guid) map.set(guid, s);
    });
    return map;
  }, [sucursales]);

  const getSucursalLabel = (habitacion) => {
    const guid = pickGuid(habitacion, "sucursalGuid", "sucursal_guid");
    const sucursal = guid ? sucursalMap.get(guid) : null;
    if (!sucursal) return guid ? `Sucursal ${guid.slice(0, 8)}…` : "Sin sucursal";
    return `${sucursal.nombreSucursal || ""} (${sucursal.codigoSucursal || "-"})`.trim();
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [habResponse, sucResponse] = await Promise.all([
        getHabitaciones({ pagina: 1, limite: 100 }),
        getSucursales({ pagina: 1, limite: 100 }),
      ]);
      setItems(normalizeAdminList(habResponse).items);
      setSucursales(normalizeAdminList(sucResponse).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las habitaciones."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onDelete = async (id) => {
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar esta habitación?"))) return;
    try {
      await deleteHabitacion(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onCambiarEstado = async (id, estado) => {
    try {
      await cambiarEstadoHabitacion(id, estado);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cambiar el estado."));
    }
  };

  return (
    <AdminListScreen
      title="Habitaciones"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "habitacionGuid", "habitacion_guid") ?? String(index)
      }
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminHabitacionForm")}
        >
          <Text style={styles.addText}>Nueva habitación</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "habitacionGuid", "habitacion_guid");
        const estado = item.estadoHabitacion || "DIS";
        const actions = [];
        if (estado !== "DIS") {
          actions.push({
            label: "Disponible",
            variant: "warning",
            onPress: () => onCambiarEstado(id, "DIS"),
          });
        }
        if (estado !== "MNT") {
          actions.push({
            label: "Mantenimiento",
            variant: "warning",
            onPress: () => onCambiarEstado(id, "MNT"),
          });
        }
        actions.push({ label: "Eliminar", variant: "danger", onPress: () => onDelete(id) });

        return (
          <AdminListCard
            title={`Hab. ${item.numeroHabitacion || "-"}`}
            subtitle={getSucursalLabel(item)}
            badge={ESTADO_LABELS[estado] || estado}
            meta={`Piso ${item.piso ?? "N/A"} · $${Number(item.precioBase || 0).toFixed(2)}`}
            onPress={() => navigation.navigate("AdminHabitacionForm", { id })}
            actions={actions}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginBottom: 12,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  addText: { color: "#fff", fontWeight: "800" },
});
