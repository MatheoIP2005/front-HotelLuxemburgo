import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { aprobarPago, getPagos, updateEstadoPago } from "../../services/pagos.service";
import { extractApiErrorMessage, normalizeCollectionPayload } from "../../../../src/shared/utils/api";
import { PAGO_ESTADOS, PAGO_METODOS } from "../../../../src/utils/constraints";
import { confirmAdminAction } from "../../utils/adminCollection";
import { formatFacturaMoney } from "../../utils/facturas";
import { colors } from "../../styles/theme";

const ESTADO_OPTIONS = [{ value: "", label: "Todos los estados" }].concat(
  PAGO_ESTADOS.map((value) => ({ value, label: value }))
);

const METODO_OPTIONS = [{ value: "", label: "Todos los métodos" }].concat(
  PAGO_METODOS.map((value) => ({ value, label: value }))
);

export default function AdminPagosScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ estado: "", metodo: "" });
  const [estadoDraft, setEstadoDraft] = useState({});

  const load = useCallback(
    async (isRefresh = false, query = filters) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const params = Object.fromEntries(
          Object.entries(query).filter(([, value]) => String(value || "").trim() !== "")
        );
        const response = await getPagos({ pagina: 1, limite: 100, ...params });
        const collection = normalizeCollectionPayload(response, { pagina: 1, limite: 100 });
        setItems(collection.items);
        setEstadoDraft(
          Object.fromEntries(
            collection.items.map((item) => [item.pagoGuid, item.estadoPago ?? "PEN"])
          )
        );
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudieron cargar los pagos."));
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

  const onAprobar = async (id) => {
    if (!(await confirmAdminAction("Aprobar", "¿Deseas aprobar este pago?"))) return;
    setError("");
    try {
      await aprobarPago(id);
      await load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo aprobar el pago."));
    }
  };

  const onUpdateEstado = async (id) => {
    const nuevoEstado = estadoDraft[id];
    const pago = items.find((item) => item.pagoGuid === id);
    if (!nuevoEstado || nuevoEstado === pago?.estadoPago) return;
    if (!(await confirmAdminAction("Cambiar estado", `¿Cambiar estado a ${nuevoEstado}?`))) return;
    setError("");
    try {
      await updateEstadoPago(id, nuevoEstado);
      await load(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cambiar el estado."));
    }
  };

  return (
    <AdminListScreen
      title="Pagos"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) => item.pagoGuid ?? String(index)}
      ListHeaderComponent={
        <>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("AdminPagoForm")}
          >
            <Text style={styles.addText}>Registrar pago</Text>
          </Pressable>
          <View style={styles.filters}>
            <View style={styles.filterField}>
              <SelectField
                label="Estado"
                value={filters.estado}
                onChange={(value) => setFilters((prev) => ({ ...prev, estado: value }))}
                options={ESTADO_OPTIONS}
              />
            </View>
            <View style={styles.filterField}>
              <SelectField
                label="Método"
                value={filters.metodo}
                onChange={(value) => setFilters((prev) => ({ ...prev, metodo: value }))}
                options={METODO_OPTIONS}
              />
            </View>
            <Pressable style={styles.searchBtn} onPress={onSearch}>
              <Text style={styles.searchText}>Buscar</Text>
            </Pressable>
          </View>
        </>
      }
      renderItem={({ item }) => {
        const id = item.pagoGuid;
        const actions = [];
        if (item.estadoPago === "PEN") {
          actions.push({ label: "Aprobar", onPress: () => onAprobar(id) });
        }

        return (
          <View style={styles.cardWrap}>
            <AdminListCard
              title={formatFacturaMoney(item.monto)}
              subtitle={item.metodoPago || "-"}
              badge={item.estadoPago || "-"}
              meta={item.fechaPagoUtc || "-"}
              actions={actions}
            />
            <View style={styles.estadoBox}>
              <SelectField
                label="Cambiar estado"
                value={estadoDraft[id] ?? item.estadoPago ?? "PEN"}
                onChange={(value) => setEstadoDraft((prev) => ({ ...prev, [id]: value }))}
                options={PAGO_ESTADOS.map((value) => ({ value, label: value }))}
              />
              <Pressable style={styles.updateBtn} onPress={() => onUpdateEstado(id)}>
                <Text style={styles.updateText}>Actualizar</Text>
              </Pressable>
            </View>
          </View>
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
  filters: { gap: 8, marginBottom: 12 },
  filterField: { marginBottom: 4 },
  searchBtn: {
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  searchText: { color: colors.onPrimary, fontWeight: "700" },
  cardWrap: { marginBottom: 4 },
  estadoBox: {
    marginTop: -4,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondaryBg,
    gap: 8,
  },
  updateBtn: {
    minHeight: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  updateText: { color: colors.onPrimary, fontWeight: "700" },
});
