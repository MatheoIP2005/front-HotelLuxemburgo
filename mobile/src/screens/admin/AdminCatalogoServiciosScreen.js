import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteCatalogoItem,
  desactivarCatalogoItem,
  getCatalogo,
} from "../../services/catalogoServicios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

export default function AdminCatalogoServiciosScreen({ navigation }) {
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
      const response = await getCatalogo({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar el catálogo."));
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
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar este registro?"))) return;
    try {
      await deleteCatalogoItem(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onDesactivar = async (id) => {
    if (!(await confirmAdminAction("Desactivar", "¿Desactivar este servicio?"))) return;
    try {
      await desactivarCatalogoItem(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo desactivar."));
    }
  };

  return (
    <AdminListScreen
      title="Catálogo de servicios"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "catalogoGuid", "catalogo_guid") ?? String(index)
      }
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminCatalogoServicioForm")}
        >
          <Text style={styles.addText}>Nuevo servicio</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "catalogoGuid", "catalogo_guid");
        return (
          <AdminListCard
            title={item.nombreCatalogo || "Sin nombre"}
            subtitle={`${item.codigoCatalogo || "-"} · ${item.categoriaCatalogo || "-"}`}
            badge={item.estadoCatalogo || "ACT"}
            meta={`${item.tipoCatalogo || "AME"} · $${Number(item.precioBase || 0).toFixed(2)}`}
            onPress={() => navigation.navigate("AdminCatalogoServicioForm", { id })}
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
  addText: { color: "#fff", fontWeight: "800" },
});
