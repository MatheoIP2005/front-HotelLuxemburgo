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
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getPermisos } from "../../services/permisos.service";
import {
  assignPermisoToRol,
  getRol,
  removePermisoFromRol,
} from "../../services/roles.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { confirmAdminAction } from "../../utils/adminCollection";
import {
  normalizePermisosList,
  permisoToOption,
  validatePermisoId,
} from "../../utils/roles";
import { colors, shadow } from "../../styles/theme";

export default function AdminRolPermisosScreen({ route }) {
  const { id } = route.params ?? {};
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [rol, setRol] = useState(null);
  const [permisosCatalog, setPermisosCatalog] = useState([]);
  const [assignedPermisos, setAssignedPermisos] = useState([]);
  const [permisoId, setPermisoId] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [rolData, permisosRes] = await Promise.all([
        getRol(id),
        getPermisos().catch(() => []),
      ]);
      setRol(rolData);
      setPermisosCatalog(normalizePermisosList(permisosRes));
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo cargar el rol."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) load();
  }, [bootstrapping, isAuthenticated, load]);

  const permisoOptions = useMemo(
    () => permisosCatalog.map(permisoToOption),
    [permisosCatalog]
  );

  const validateAndGetId = () => {
    const message = validatePermisoId(permisoId);
    setFieldError(message);
    return message ? null : Number(permisoId);
  };

  const handleAssign = async () => {
    const parsedId = validateAndGetId();
    if (!parsedId) return;

    setActionLoading(true);
    setError("");
    try {
      await assignPermisoToRol(id, parsedId);
      setAssignedPermisos((prev) =>
        prev.includes(String(parsedId)) ? prev : [...prev, String(parsedId)]
      );
      setPermisoId("");
      setFieldError("");
      Alert.alert("Permisos", "Permiso asignado correctamente.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar el permiso."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (idPermiso) => {
    if (!(await confirmAdminAction("Quitar permiso", "¿Quitar este permiso del rol?"))) return;
    setActionLoading(true);
    setError("");
    try {
      await removePermisoFromRol(id, idPermiso);
      setAssignedPermisos((prev) => prev.filter((item) => item !== String(idPermiso)));
      Alert.alert("Permisos", "Permiso removido.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo remover el permiso."));
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
      <Text style={styles.title}>Permisos del rol</Text>
      <Text style={styles.subtitle}>{rol?.nombreRol || "-"}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AdminDetailSection title="Catálogo de permisos">
        {permisosCatalog.length === 0 ? (
          <Text style={styles.muted}>
            El backend no expone permisos en el catálogo. Usa el ID manual.
          </Text>
        ) : (
          permisosCatalog.map((permiso, index) =>
            permiso != null && permiso !== "" ? (
            <Text key={`${permiso}-${index}`} style={styles.catalogItem}>
              {typeof permiso === "string" ? permiso : String(permiso)}
            </Text>
            ) : null
          )
        )}
      </AdminDetailSection>

      <AdminDetailSection title="Asignar o quitar permiso">
        <ScrollSelectField
          label="Permiso del catálogo"
          value={permisoId}
          onChange={setPermisoId}
          options={permisoOptions}
          placeholder="Selecciona un permiso"
        />
        <FormField
          label="ID permiso manual"
          value={permisoId}
          onChangeText={setPermisoId}
          keyboardType="number-pad"
          placeholder="Ej. 1"
          error={fieldError}
        />
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, actionLoading && styles.disabled]}
            disabled={actionLoading}
            onPress={handleAssign}
          >
            <Text style={styles.primaryBtnText}>Asignar permiso</Text>
          </Pressable>
          <Pressable
            style={[styles.warningBtn, actionLoading && styles.disabled]}
            disabled={actionLoading}
            onPress={() => {
              const parsedId = validateAndGetId();
              if (parsedId) handleRemove(parsedId);
            }}
          >
            <Text style={styles.primaryBtnText}>Quitar permiso</Text>
          </Pressable>
        </View>
      </AdminDetailSection>

      <AdminDetailSection title="Permisos asignados en sesión">
        {assignedPermisos.length === 0 ? (
          <Text style={styles.muted}>
            No hay permisos registrados localmente. El backend no devuelve la lista asignada.
          </Text>
        ) : (
          assignedPermisos.map((permiso) => (
            <View key={permiso} style={styles.permisoCard}>
              <Text style={styles.permisoId}>ID {permiso}</Text>
              <Pressable
                style={styles.removeBtn}
                disabled={actionLoading}
                onPress={() => handleRemove(permiso)}
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
  catalogItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryBg,
    color: colors.text,
  },
  actions: { gap: 8, marginTop: 8 },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  warningBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  permisoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    ...shadow,
  },
  permisoId: { fontWeight: "700", color: colors.text },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  removeText: { color: colors.onPrimary, fontWeight: "700", fontSize: 12 },
});
