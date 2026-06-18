import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import { deleteRol, getRoles, inhabilitarRol } from "../../services/roles.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction, filterSafeList } from "../../utils/adminCollection";
import { getRolId } from "../../utils/roles";
import { colors } from "../../styles/theme";

export default function AdminRolesScreen({ navigation }) {
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
      const response = await getRoles();
      setItems(
        filterSafeList(Array.isArray(response) ? response : response?.items ?? [])
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los roles."));
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
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar este rol?"))) return;
    try {
      await deleteRol(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onInhabilitar = async (id) => {
    if (!(await confirmAdminAction("Inhabilitar", "¿Inhabilitar este rol?"))) return;
    try {
      await inhabilitarRol(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo inhabilitar."));
    }
  };

  return (
    <AdminListScreen
      title="Roles"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) => String(getRolId(item) ?? index)}
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminRolForm")}
        >
          <Text style={styles.addText}>Nuevo rol</Text>
        </Pressable>
      }
      renderItem={({ item }) => {
        const id = getRolId(item);
        const actions = [
          {
            label: "Editar",
            onPress: () => navigation.navigate("AdminRolForm", { id }),
          },
        ];
        if (item.estadoRol === "ACT") {
          actions.push({
            label: "Inhabilitar",
            variant: "warning",
            onPress: () => onInhabilitar(id),
          });
        }
        actions.push({
          label: "Eliminar",
          variant: "danger",
          onPress: () => onDelete(id),
        });

        return (
          <AdminListCard
            title={item.nombreRol || "-"}
            subtitle={item.descripcionRol || "Sin descripción"}
            badge={item.estadoRol || "-"}
            meta={item.activo ? "Activo: Sí" : "Activo: No"}
            onPress={() => navigation.navigate("AdminRolForm", { id })}
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
  addText: { color: colors.onPrimary, fontWeight: "800" },
});
