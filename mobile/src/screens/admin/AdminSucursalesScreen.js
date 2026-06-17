import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  deleteSucursal,
  getSucursales,
  inhabilitarSucursal,
} from "../../services/sucursales.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

export default function AdminSucursalesScreen({ navigation }) {
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
      const response = await getSucursales({ pagina: 1, limite: 100 });
      setItems(normalizeAdminList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las sucursales."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onDelete = async (guid) => {
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar esta sucursal?"))) return;
    try {
      await deleteSucursal(guid);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onInhabilitar = async (guid) => {
    if (!(await confirmAdminAction("Inhabilitar", "¿Inhabilitar esta sucursal?"))) return;
    try {
      await inhabilitarSucursal(guid);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo inhabilitar."));
    }
  };

  return (
    <AdminListScreen
      title="Sucursales"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "sucursalGuid", "sucursal_guid") ?? String(index)
      }
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminSucursalForm")}
        >
          <Text style={styles.addText}>Nueva sucursal</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        if (!item) return null;
        const guid = pickGuid(item, "sucursalGuid", "sucursal_guid");
        return (
          <AdminListCard
            title={item.nombreSucursal || "Sin nombre"}
            subtitle={`${item.codigoSucursal ?? item.codigo_sucursal ?? "-"} · ${item.ciudad || "-"}`}
            badge={item.estadoSucursal || "ACT"}
            meta={`${item.tipoAlojamiento || "hotel"} · ${item.estrellas ?? "-"}★`}
            onPress={() => navigation.navigate("AdminSucursalForm", { id: guid })}
            actions={[
              {
                label: "Inhabilitar",
                variant: "warning",
                onPress: () => onInhabilitar(guid),
              },
              { label: "Eliminar", variant: "danger", onPress: () => onDelete(guid) },
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
  addText: {
    color: colors.onPrimary,
    fontWeight: "800",
  },
});
