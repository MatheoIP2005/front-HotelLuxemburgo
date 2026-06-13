import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../../components/admin/AdminListCard";
import AdminListScreen from "../../components/admin/AdminListScreen";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getEstadias } from "../../services/estadias.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import {
  formatEstadiaDateTime,
  getEstadiaId,
  normalizeEstadiasList,
} from "../../utils/estadias";
import { colors } from "../../styles/theme";

export default function AdminEstadiasScreen({ navigation }) {
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
      const response = await getEstadias({ pagina: 1, limite: 50 });
      setItems(normalizeEstadiasList(response).items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las estadías."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  return (
    <AdminListScreen
      title="Estadías"
      subtitle={`${items.length} registros`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => load(true)}
      onRetry={() => load()}
      keyExtractor={(item, index) => String(getEstadiaId(item) ?? index)}
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminEstadiaDetail", { mode: "checkin" })}
        >
          <Text style={styles.addText}>Check-in por reserva</Text>
        </Pressable>
      }
      renderItem={({ item }) => (
        <AdminListCard
          title={`Estadía ${String(getEstadiaId(item) ?? "").slice(0, 8)}…`}
          subtitle={`Check-in: ${formatEstadiaDateTime(item.checkinUtc)}`}
          badge={item.estadoEstadia || "-"}
          meta={`Check-out: ${formatEstadiaDateTime(item.checkoutUtc)}`}
          onPress={() =>
            navigation.navigate("AdminEstadiaDetail", { id: getEstadiaId(item) })
          }
        />
      )}
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
