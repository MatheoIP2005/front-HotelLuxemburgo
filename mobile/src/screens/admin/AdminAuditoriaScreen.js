import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getAuditoria } from "../../services/auditoria.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import {
  buildAuditoriaQuery,
  formatAuditoriaDateTime,
  getAuditoriaFecha,
  getAuditoriaId,
  getAuditoriaIdRegistro,
  getAuditoriaOperacion,
  getAuditoriaTabla,
  getAuditoriaUsuario,
  normalizeAuditoriaList,
} from "../../utils/auditoria";
import { colors } from "../../styles/theme";

const EMPTY_FILTERS = {
  servicioOrigen: "",
  tablaAfectada: "",
  usuarioEjecutor: "",
  entidadGuid: "",
};

export default function AdminAuditoriaScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const load = useCallback(
    async (isRefresh = false, query = filters) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const params = buildAuditoriaQuery({
          pagina: 1,
          limite: 50,
          ...query,
        });
        const response = await getAuditoria(params);
        const collection = normalizeAuditoriaList(response, params);
        setItems(collection.items);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudieron cargar los eventos de auditoría."));
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const onSearch = () => load(false, filters);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminListScreen
      title="Auditoría"
      subtitle={`${items.length} eventos · solo lectura`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) => String(getAuditoriaId(item) ?? index)}
      ListHeaderComponent={
        <View style={styles.filters}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          <TextInput
            style={styles.input}
            value={filters.servicioOrigen}
            onChangeText={(value) => setFilter("servicioOrigen", value)}
            placeholder="Servicio origen"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={filters.tablaAfectada}
            onChangeText={(value) => setFilter("tablaAfectada", value)}
            placeholder="Tabla afectada"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={filters.usuarioEjecutor}
            onChangeText={(value) => setFilter("usuarioEjecutor", value)}
            placeholder="Usuario ejecutor"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={filters.entidadGuid}
            onChangeText={(value) => setFilter("entidadGuid", value)}
            placeholder="GUID entidad (opcional)"
            autoCapitalize="none"
          />
          <Pressable style={styles.searchBtn} onPress={onSearch}>
            <Text style={styles.searchText}>Buscar</Text>
          </Pressable>
          <Pressable
            style={styles.clearBtn}
            onPress={() => {
              setFilters(EMPTY_FILTERS);
              load(false, EMPTY_FILTERS);
            }}
          >
            <Text style={styles.clearText}>Limpiar filtros</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => {
        const id = getAuditoriaId(item);
        return (
          <AdminListCard
            title={getAuditoriaTabla(item)}
            subtitle={`${getAuditoriaOperacion(item)} · ${getAuditoriaUsuario(item)}`}
            badge={getAuditoriaOperacion(item)}
            meta={`${formatAuditoriaDateTime(getAuditoriaFecha(item))} · ID ${getAuditoriaIdRegistro(item)}`}
            onPress={() => navigation.navigate("AdminAuditoriaDetail", { id })}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  filters: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondaryBg,
    gap: 8,
  },
  filtersTitle: { fontWeight: "800", color: colors.text },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  searchText: { color: colors.onPrimary, fontWeight: "700" },
  clearBtn: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: colors.primaryDark, fontWeight: "700" },
});
