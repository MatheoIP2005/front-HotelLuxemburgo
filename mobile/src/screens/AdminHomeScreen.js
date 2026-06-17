import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdminModuleGrid, { AdminSectionTabs } from "../components/admin/AdminModuleGrid";
import { getAllAdminModules } from "../config/adminModules";
import { useAuth } from "../context/AuthContext";
import { getReservas } from "../services/reservas.service";
import { normalizeReservasList } from "../utils/reservas";
import { colors, shadow } from "../styles/theme";

export default function AdminHomeScreen({ navigation }) {
  const { user, isAuthenticated, bootstrapping, handleLogout, loading } = useAuth();
  const [stats, setStats] = useState({ total: 0, pendientes: 0, confirmadas: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("all");

  const moduleCount = useMemo(() => getAllAdminModules().length, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getReservas({ pagina: 1, limite: 100 });
      const collection = normalizeReservasList(response, { pagina: 1, limite: 100 });
      const pendientes = collection.items.filter(
        (item) => item && String(item.estadoReserva || "").toUpperCase() === "PEN"
      ).length;
      const confirmadas = collection.items.filter(
        (item) => item && String(item.estadoReserva || "").toUpperCase() === "CON"
      ).length;

      setStats({
        total: collection.total || collection.items.length,
        pendientes,
        confirmadas,
      });
    } catch {
      setStats({ total: 0, pendientes: 0, confirmadas: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapping) return;

    if (!isAuthenticated) {
      navigation.replace("Login");
      return;
    }

    loadStats();
  }, [bootstrapping, isAuthenticated, loadStats, navigation]);

  const onLogout = async () => {
    await handleLogout();
    navigation.replace("Login");
  };

  if (bootstrapping) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Panel admin</Text>
        <Text style={styles.title}>Hola, {user?.username || "admin"}</Text>
        <Text style={styles.muted}>
          {moduleCount} módulos disponibles con paridad del frontend web. Usa las secciones
          para filtrar o abre cualquier módulo desde la cuadrícula.
        </Text>

        <View style={styles.statsRow}>
          <StatBox label="Reservas" value={statsLoading ? "..." : stats.total} />
          <StatBox label="Pendientes" value={statsLoading ? "..." : stats.pendientes} />
          <StatBox label="Confirmadas" value={statsLoading ? "..." : stats.confirmadas} />
        </View>

        {statsLoading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      <AdminSectionTabs activeSection={activeSection} onChange={setActiveSection} />
      <AdminModuleGrid navigation={navigation} activeSection={activeSection} />

      <View style={styles.footer}>
        <Pressable
          style={[styles.secondaryButton, loading && styles.disabledButton]}
          disabled={loading}
          onPress={onLogout}
        >
          <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Search")}>
          <Text style={styles.link}>Ir al booking público</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 20,
    gap: 14,
    ...shadow,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  muted: {
    color: colors.muted,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    gap: 12,
    alignItems: "center",
  },
  secondaryButton: {
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  disabledButton: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "800",
  },
  link: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
