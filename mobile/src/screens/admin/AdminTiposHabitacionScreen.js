import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteTipoHabitacion,
  getTiposHabitacion,
} from "../../services/tiposHabitacion.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

export default function AdminTiposHabitacionScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await getTiposHabitacion({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los tipos."));
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
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar este tipo de habitación?"))) return;
    try {
      await deleteTipoHabitacion(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  return (
    <AdminListScreen
      title="Tipos de habitación"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "tipoHabitacionGuid", "tipo_habitacion_guid") ?? String(index)
      }
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminTipoHabitacionForm")}
        >
          <Text style={styles.addText}>Nuevo tipo</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "tipoHabitacionGuid", "tipo_habitacion_guid");
        return (
          <AdminListCard
            title={item.nombreTipoHabitacion || "Sin nombre"}
            subtitle={item.codigoTipoHabitacion || "-"}
            badge={item.estadoTipoHabitacion || "ACT"}
            meta={`${item.capacidadAdultos ?? 0} adultos · ${item.capacidadNinos ?? 0} niños`}
            onPress={() => navigation.navigate("AdminTipoHabitacionForm", { id })}
            actions={[
              { label: "Eliminar", variant: "danger", onPress: () => onDelete(id) },
            ]}
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
  addText: { color: colors.onPrimary, fontWeight: "800" },
});
