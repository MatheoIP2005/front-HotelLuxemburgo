import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getPermisos } from "../../services/permisos.service";
import {
  assignPermisoToRol,
  createRol,
  getRol,
  removePermisoFromRol,
  updateRol,
} from "../../services/roles.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS, ROLE_STATES } from "../../../../src/utils/constraints";
import {
  confirmAdminAction,
  ensureLoadedEntity,
  FORM_VALIDATION_BANNER,
  pickGuid,
} from "../../utils/adminCollection";
import {
  normalizePermisosList,
  permisoToOption,
  validatePermisoId,
  validateRolForm,
} from "../../utils/roles";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  nombreRol: "",
  descripcionRol: "",
  estadoRol: "ACT",
};

const ESTADO_OPTIONS = ROLE_STATES.map((value) => ({ value, label: value }));

export default function AdminRolFormScreen({ navigation, route }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [permisosCatalog, setPermisosCatalog] = useState([]);
  const [permisoId, setPermisoId] = useState("");
  const [permisoFieldError, setPermisoFieldError] = useState("");
  const [permisoActionLoading, setPermisoActionLoading] = useState(false);

  const loadPermisos = useCallback(async () => {
    try {
      const permisosRes = await getPermisos().catch(() => []);
      setPermisosCatalog(normalizePermisosList(permisosRes));
    } catch {
      setPermisosCatalog([]);
    }
  }, []);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getRol(id);
        if (!ensureLoadedEntity(data, setError, "Rol no encontrado.")) return;
        setForm({
          nombreRol: data.nombreRol ?? "",
          descripcionRol: data.descripcionRol ?? "",
          estadoRol: data.estadoRol ?? "ACT",
        });
        await loadPermisos();
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el rol."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit, loadPermisos]);

  const permisoOptions = useMemo(
    () => permisosCatalog.map(permisoToOption),
    [permisosCatalog]
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validatePermisoInput = () => {
    const message = validatePermisoId(permisoId);
    setPermisoFieldError(message);
    return message ? null : Number(permisoId);
  };

  const handleAssignPermiso = async () => {
    const parsedId = validatePermisoInput();
    if (!parsedId) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setPermisoActionLoading(true);
    setError("");
    try {
      await assignPermisoToRol(id, parsedId);
      setPermisoId("");
      setPermisoFieldError("");
      Alert.alert("Permisos", "Permiso asignado correctamente.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar el permiso."));
    } finally {
      setPermisoActionLoading(false);
    }
  };

  const handleRemovePermiso = async () => {
    const parsedId = validatePermisoInput();
    if (!parsedId) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }
    if (!(await confirmAdminAction("Quitar permiso", "¿Quitar este permiso del rol?"))) return;

    setPermisoActionLoading(true);
    setError("");
    try {
      await removePermisoFromRol(id, parsedId);
      setPermisoId("");
      setPermisoFieldError("");
      Alert.alert("Permisos", "Permiso removido.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo remover el permiso."));
    } finally {
      setPermisoActionLoading(false);
    }
  };

  const onSubmit = async () => {
    const errors = validateRolForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        nombreRol: form.nombreRol.trim(),
        descripcionRol: form.descripcionRol.trim() || null,
        ...(isEdit ? { estadoRol: form.estadoRol } : {}),
      };

      if (isEdit) {
        await updateRol(id, payload);
        Alert.alert("Rol", "Rol actualizado.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const created = await createRol(payload);
        const createdId = pickGuid(created, "rolGuid", "rol_guid", "id");
        Alert.alert("Rol", "Rol creado.", [
          {
            text: "Gestionar permisos",
            onPress: () => {
              if (createdId) {
                navigation.replace("AdminRolForm", { id: createdId });
              } else {
                Alert.alert(
                  "Rol creado",
                  "No se pudo abrir la gestión de permisos automáticamente. Edita el rol desde la lista."
                );
                navigation.navigate("AdminRoles");
              }
            },
          },
          { text: "Volver", onPress: () => navigation.navigate("AdminRoles") },
        ]);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo guardar el rol."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormScreen
      title={isEdit ? "Editar rol" : "Nuevo rol"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      loading={loading || bootstrapping}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <AdminDetailSection title="Datos del rol">
        <FormField
          label="Nombre"
          value={form.nombreRol}
          onChangeText={(value) => setField("nombreRol", value)}
          maxLength={MAX_LENGTHS.rol.nombre}
          error={fieldErrors.nombreRol}
        />
        <FormField
          label="Descripción"
          value={form.descripcionRol}
          onChangeText={(value) => setField("descripcionRol", value)}
          maxLength={MAX_LENGTHS.rol.descripcion}
          multiline
          error={fieldErrors.descripcionRol}
          helpText="Resume el alcance del rol y cuándo debe usarse."
        />

        {isEdit ? (
          <SelectField
            label="Estado"
            value={form.estadoRol}
            onChange={(value) => setField("estadoRol", value)}
            options={ESTADO_OPTIONS}
            error={fieldErrors.estadoRol}
          />
        ) : null}
      </AdminDetailSection>

      {isEdit ? (
        <AdminDetailSection title="Permisos">
          {permisosCatalog.length === 0 ? (
            <Text style={styles.muted}>
              El catálogo de permisos no está disponible. Usa el ID manual.
            </Text>
          ) : null}
          <ScrollSelectField
            label="Permiso"
            value={permisoId}
            onChange={(value) => {
              setPermisoId(value);
              if (permisoFieldError) setPermisoFieldError("");
            }}
            options={permisoOptions}
            placeholder="Selecciona un permiso"
          />
          <Text style={styles.muted}>
            Selecciona del catálogo o escribe el ID manualmente abajo.
          </Text>
          <FormField
            label="ID permiso manual"
            value={permisoId}
            onChangeText={(value) => {
              setPermisoId(value);
              if (permisoFieldError) setPermisoFieldError("");
            }}
            keyboardType="number-pad"
            placeholder="Ej. 1"
            error={permisoFieldError}
          />
          <Pressable
            style={[styles.primaryBtn, permisoActionLoading && styles.disabled]}
            disabled={permisoActionLoading || saving}
            onPress={handleAssignPermiso}
          >
            <Text style={styles.primaryBtnText}>Asignar permiso</Text>
          </Pressable>
          <Pressable
            style={[styles.warningBtn, permisoActionLoading && styles.disabled]}
            disabled={permisoActionLoading || saving}
            onPress={handleRemovePermiso}
          >
            <Text style={styles.primaryBtnText}>Quitar permiso</Text>
          </Pressable>
        </AdminDetailSection>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  warningBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
    marginTop: 8,
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});
