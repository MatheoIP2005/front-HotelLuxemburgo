import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteTarifa,
  desactivarTarifa,
  getTarifas,
} from "../../services/tarifas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

export default function AdminTarifasScreen({ navigation }) {
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
      const response = await getTarifas({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las tarifas."));
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
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar esta tarifa?"))) return;
    try {
      await deleteTarifa(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onDesactivar = async (id) => {
    if (!(await confirmAdminAction("Desactivar", "¿Desactivar esta tarifa?"))) return;
    try {
      await desactivarTarifa(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo desactivar."));
    }
  };

  return (
    <AdminListScreen
      title="Tarifas"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "tarifaGuid", "tarifa_guid") ?? String(index)
      }
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminTarifaForm")}
        >
          <Text style={styles.addText}>Nueva tarifa</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "tarifaGuid", "tarifa_guid");
        return (
          <AdminListCard
            title={item.nombreTarifa || "Sin nombre"}
            subtitle={item.codigoTarifa || "-"}
            badge={item.estadoTarifa || "ACT"}
            meta={`${item.canalTarifa || "-"} · $${Number(item.precioPorNoche || 0).toFixed(2)}/noche`}
            onPress={() => navigation.navigate("AdminTarifaForm", { id })}
            actions={[
              { label: "Desactivar", variant: "warning", onPress: () => onDesactivar(id) },
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
