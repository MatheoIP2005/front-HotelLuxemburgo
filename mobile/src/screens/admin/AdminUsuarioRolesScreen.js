import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getRoles } from "../../services/roles.service";
import {
  asignarRolUsuario,
  getUsuario,
  getUsuarioRoles,
  removerRolUsuario,
} from "../../services/usuarios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction } from "../../utils/adminCollection";
import { getRolId } from "../../utils/roles";
import { getUsuarioDisplayName } from "../../utils/usuarios";
import { colors, shadow } from "../../styles/theme";

export default function AdminUsuarioRolesScreen({ navigation, route }) {
  const { id } = route.params ?? {};
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [usuario, setUsuario] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [selectedRolGuid, setSelectedRolGuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [userData, catalog, userRoles] = await Promise.all([
        getUsuario(id),
        getRoles().catch(() => []),
        getUsuarioRoles(id).catch(() => []),
      ]);
      setUsuario(userData);
      setRolesCatalog(Array.isArray(catalog) ? catalog : catalog?.items ?? []);
      setAssignedRoles(Array.isArray(userRoles) ? userRoles : userRoles?.items ?? []);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar los roles del usuario."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const availableOptions = useMemo(() => {
    const assignedIds = new Set(assignedRoles.map((r) => String(getRolId(r))));
    return rolesCatalog
      .filter((rol) => !assignedIds.has(String(getRolId(rol))))
      .map((rol) => ({
        value: getRolId(rol),
        label: rol.nombreRol || String(getRolId(rol)),
      }));
  }, [assignedRoles, rolesCatalog]);

  const handleAssign = async () => {
    if (!selectedRolGuid) {
      setError("Selecciona un rol para asignar.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await asignarRolUsuario(id, selectedRolGuid);
      setSelectedRolGuid("");
      Alert.alert("Roles", "Rol asignado correctamente.");
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar el rol."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (rolGuid) => {
    if (!(await confirmAdminAction("Quitar rol", "¿Quitar este rol del usuario?"))) return;
    setActionLoading(true);
    setError("");
    try {
      await removerRolUsuario(id, rolGuid);
      Alert.alert("Roles", "Rol removido.");
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo remover el rol."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Roles del usuario</Text>
      <Text style={styles.subtitle}>
        {usuario?.username} · {getUsuarioDisplayName(usuario)}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AdminDetailSection title="Asignar rol">
        <ScrollSelectField
          label="Rol disponible"
          value={selectedRolGuid}
          onChange={setSelectedRolGuid}
          options={availableOptions}
          placeholder="Selecciona un rol"
        />
        <Pressable
          style={[styles.primaryBtn, actionLoading && styles.disabled]}
          disabled={actionLoading}
          onPress={handleAssign}
        >
          <Text style={styles.primaryBtnText}>Asignar rol</Text>
        </Pressable>
      </AdminDetailSection>

      <AdminDetailSection title="Roles asignados">
        {assignedRoles.length === 0 ? (
          <Text style={styles.muted}>Este usuario no tiene roles asignados.</Text>
        ) : (
          assignedRoles.map((rol) => (
            <View key={getRolId(rol)} style={styles.roleCard}>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>{rol.nombreRol || "-"}</Text>
                <Text style={styles.roleMeta}>Estado: {rol.estadoRol || "-"}</Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                disabled={actionLoading}
                onPress={() => handleRemove(getRolId(rol))}
              >
                <Text style={styles.removeText}>Quitar</Text>
              </Pressable>
            </View>
          ))
        )}
      </AdminDetailSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 8 },
  error: { color: colors.danger, fontWeight: "600" },
  muted: { color: colors.muted },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    ...shadow,
  },
  roleInfo: { flex: 1 },
  roleName: { fontWeight: "700", color: colors.text },
  roleMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.warning,
  },
  removeText: { color: colors.onPrimary, fontWeight: "700", fontSize: 12 },
});
