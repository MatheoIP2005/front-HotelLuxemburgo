import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getSucursales } from "../../services/sucursales.service";
import {
  deleteValoracion,
  getValoraciones,
  moderarValoracion,
} from "../../services/valoraciones.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { VALORACION_MODERATION_STATES } from "../../../../src/utils/constraints";
import { confirmAdminAction, normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import SelectField from "../../components/admin/SelectField";
import { colors } from "../../styles/theme";

export default function AdminValoracionesScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalGuid, setSucursalGuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [moderarId, setModerarId] = useState(null);
  const [estadoModeracion, setEstadoModeracion] = useState("PUB");

  const sucursalOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        value: pickGuid(s, "sucursalGuid", "sucursal_guid"),
        label: `${s.nombreSucursal} (${s.codigoSucursal})`,
      })),
    [sucursales]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const params = { pagina: 1, limite: 50 };
        if (sucursalGuid) params.sucursalGuid = sucursalGuid;
        const response = await getValoraciones(params);
        setItems(normalizeAdminList(response).items);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudieron cargar valoraciones."));
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sucursalGuid]
  );

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    getSucursales({ pagina: 1, limite: 100 })
      .then((r) => setSucursales(normalizeAdminList(r).items))
      .catch(() => setSucursales([]));
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onDelete = async (id) => {
    if (!(await confirmAdminAction("Eliminar", "¿Eliminar esta valoración?"))) return;
    try {
      await deleteValoracion(id);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar."));
    }
  };

  const onConfirmModerar = async () => {
    if (!moderarId) return;
    try {
      await moderarValoracion(moderarId, { estadoValoracion: estadoModeracion });
      setModerarId(null);
      load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo moderar."));
    }
  };

  return (
    <AdminListScreen
      title="Valoraciones"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) =>
        pickGuid(item, "valoracionGuid", "valoracion_guid") ?? String(index)
      }
      ListHeaderComponent={
        <>
          <ScrollSelectField
            label="Filtrar por sucursal"
            value={sucursalGuid}
            options={[{ value: "", label: "Todas" }, ...sucursalOptions]}
            onChange={setSucursalGuid}
            maxHeight={120}
          />
          <Pressable style={styles.searchButton} onPress={() => load()}>
            <Text style={styles.searchText}>Buscar</Text>
          </Pressable>
          {moderarId ? (
            <View style={styles.moderarBox}>
              <Text style={styles.moderarTitle}>Moderar valoración</Text>
              <SelectField
                label="Nuevo estado"
                value={estadoModeracion}
                options={VALORACION_MODERATION_STATES.map((s) => ({ value: s, label: s }))}
                onChange={setEstadoModeracion}
              />
              <View style={styles.moderarActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setModerarId(null)}>
                  <Text>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={onConfirmModerar}>
                  <Text style={styles.searchText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const id = pickGuid(item, "valoracionGuid", "valoracion_guid");
        return (
          <AdminListCard
            title={`Puntuación ${item.puntuacionGeneral ?? "-"}/10`}
            subtitle={item.tipoViaje || "Sin tipo viaje"}
            badge={item.estadoValoracion || "-"}
            meta={item.publicadaEnPortal ? "Publicada en portal" : "No publicada"}
            onPress={() => navigation.navigate("AdminValoracionDetail", { id })}
            actions={[
              {
                label: "Moderar",
                variant: "warning",
                onPress: () => {
                  setModerarId(id);
                  setEstadoModeracion("PUB");
                },
              },
              { label: "Eliminar", variant: "danger", onPress: () => onDelete(id) },
            ]}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  searchButton: {
    marginBottom: 12,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  searchText: { color: "#fff", fontWeight: "800" },
  moderarBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: 8,
  },
  moderarTitle: { fontWeight: "800", color: colors.text },
  moderarActions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
});
