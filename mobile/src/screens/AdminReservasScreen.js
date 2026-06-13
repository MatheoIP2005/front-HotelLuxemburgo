import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import AdminListCard from "../components/admin/AdminListCard";
import AdminListScreen from "../components/admin/AdminListScreen";
import useRequireAuth from "../hooks/useRequireAuth";
import { getReservas } from "../services/reservas.service";
import { extractApiErrorMessage } from "../../../src/shared/utils/api";
import {
  formatReservaDate,
  formatReservaMoney,
  getReservaId,
  normalizeReservasList,
} from "../utils/reservas";
import { colors } from "../styles/theme";

export default function AdminReservasScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReservas = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await getReservas({ pagina: 1, limite: 50 });
      const collection = normalizeReservasList(response, { pagina: 1, limite: 50 });
      setItems(collection.items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar las reservas."));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapping) return;

    if (!isAuthenticated) {
      navigation.replace("Login");
      return;
    }

    loadReservas();
  }, [bootstrapping, isAuthenticated, loadReservas, navigation]);

  const openDetail = (reserva) => {
    const id = getReservaId(reserva);
    if (!id) return;
    navigation.navigate("AdminReservaDetail", { id });
  };

  return (
    <AdminListScreen
      title="Reservas"
      subtitle={`${items.length} registros recientes`}
      items={items}
      loading={loading || bootstrapping}
      refreshing={refreshing}
      error={error}
      onRefresh={() => loadReservas(true)}
      onRetry={() => loadReservas()}
      keyExtractor={(item, index) => String(getReservaId(item) ?? index)}
      ListHeaderComponent={
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AdminReservaForm")}
        >
          <Text style={styles.addText}>Nueva reserva</Text>
        </Pressable>
      }
      renderItem={({ item }) => (
        <AdminListCard
          title={item.codigoReserva || "Sin código"}
          subtitle={`${formatReservaDate(item.fechaInicio)} → ${formatReservaDate(item.fechaFin)}`}
          badge={item.estadoReserva || "-"}
          meta={formatReservaMoney(item.totalReserva)}
          onPress={() => openDetail(item)}
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
