import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getRoles } from "../../services/roles.service";
import {
  asignarRolUsuario,
  createUsuario,
  getUsuario,
  getUsuarioRoles,
  removerRolUsuario,
  updateUsuario,
} from "../../services/usuarios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS, USER_STATES } from "../../../../src/utils/constraints";
import { validateUsuarioForm, resolveUsuarioFieldUpdate } from "../../utils/usuarios";
import {
  confirmAdminAction,
  ensureLoadedEntity,
  filterSafeList,
  FORM_VALIDATION_BANNER,
  pickGuid,
} from "../../utils/adminCollection";
import { getRolId } from "../../utils/roles";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  username: "",
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  estadoUsuario: "ACT",
  rowVersion: null,
};

const ESTADO_OPTIONS = USER_STATES.map((value) => ({ value, label: value }));

export default function AdminUsuarioFormScreen({ navigation, route }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [selectedRolGuid, setSelectedRolGuid] = useState("");
  const [rolesActionLoading, setRolesActionLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    if (!isEdit || !id) return;
    try {
      const [catalog, userRoles] = await Promise.all([
        getRoles().catch(() => []),
        getUsuarioRoles(id).catch(() => []),
      ]);
      setRolesCatalog(
        filterSafeList(Array.isArray(catalog) ? catalog : catalog?.items ?? [])
      );
      setAssignedRoles(
        filterSafeList(Array.isArray(userRoles) ? userRoles : userRoles?.items ?? [])
      );
    } catch {
      setRolesCatalog([]);
      setAssignedRoles([]);
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsuario(id);
        if (!ensureLoadedEntity(data, setError, "Usuario no encontrado.")) return;
        setForm({
          username: data.username ?? "",
          nombres: data.nombres ?? "",
          apellidos: data.apellidos ?? "",
          correo: data.correo ?? "",
          password: "",
          estadoUsuario: data.estadoUsuario ?? "ACT",
          rowVersion: data.rowVersion ?? null,
        });
        await loadRoles();
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el usuario."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit, loadRoles]);

  const availableRoleOptions = useMemo(() => {
    const assignedIds = new Set(assignedRoles.map((r) => String(getRolId(r))));
    return rolesCatalog
      .filter((rol) => rol && !assignedIds.has(String(getRolId(rol))))
      .map((rol) => ({
        value: getRolId(rol),
        label: rol?.nombreRol || String(getRolId(rol)),
      }));
  }, [assignedRoles, rolesCatalog]);

  const setField = (key, value) =>
    setForm((prev) => resolveUsuarioFieldUpdate(prev, key, value));

  const handleAssignRole = async () => {
    if (!selectedRolGuid) {
      setError("Selecciona un rol para asignar.");
      return;
    }
    setRolesActionLoading(true);
    setError("");
    try {
      await asignarRolUsuario(id, selectedRolGuid);
      setSelectedRolGuid("");
      await loadRoles();
      Alert.alert("Roles", "Rol asignado correctamente.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo asignar el rol."));
    } finally {
      setRolesActionLoading(false);
    }
  };

  const handleRemoveRole = async (rolGuid) => {
    if (!(await confirmAdminAction("Quitar rol", "¿Quitar este rol del usuario?"))) return;
    setRolesActionLoading(true);
    setError("");
    try {
      await removerRolUsuario(id, rolGuid);
      await loadRoles();
      Alert.alert("Roles", "Rol removido.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo remover el rol."));
    } finally {
      setRolesActionLoading(false);
    }
  };

  const onSubmit = async () => {
    const errors = validateUsuarioForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        username: form.username.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim() || null,
        correo: form.correo.trim(),
        ...(isEdit
          ? {
              estadoUsuario: form.estadoUsuario,
              rowVersion: form.rowVersion,
            }
          : { password: form.password.trim() }),
      };

      if (isEdit) {
        await updateUsuario(id, payload);
        Alert.alert("Usuario", "Usuario actualizado.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const created = await createUsuario(payload);
        const createdId = pickGuid(created, "usuarioGuid", "usuario_guid", "id");
        Alert.alert("Usuario", "Usuario creado.", [
          {
            text: "Asignar roles",
            onPress: () => {
              if (createdId) {
                navigation.replace("AdminUsuarioForm", { id: createdId });
              } else {
                Alert.alert(
                  "Usuario creado",
                  "No se pudo abrir la asignación de roles automáticamente. Edita el usuario desde la lista."
                );
                navigation.navigate("AdminUsuarios");
              }
            },
          },
          { text: "Volver", onPress: () => navigation.navigate("AdminUsuarios") },
        ]);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo guardar el usuario."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormScreen
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      loading={loading || bootstrapping}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <AdminDetailSection title="Datos del usuario">
        <FormField
          label="Username"
          value={form.username}
          onChangeText={(value) => setField("username", value)}
          maxLength={MAX_LENGTHS.usuario.username}
          autoCapitalize="none"
          error={fieldErrors.username}
        />
        <FormField
          label="Nombres"
          value={form.nombres}
          onChangeText={(value) => setField("nombres", value)}
          maxLength={MAX_LENGTHS.usuario.nombres}
          error={fieldErrors.nombres}
        />
        <FormField
          label="Apellidos"
          value={form.apellidos}
          onChangeText={(value) => setField("apellidos", value)}
          maxLength={MAX_LENGTHS.usuario.apellidos}
          error={fieldErrors.apellidos}
        />
        <FormField
          label="Correo"
          value={form.correo}
          onChangeText={(value) => setField("correo", value)}
          maxLength={MAX_LENGTHS.usuario.correo}
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.correo}
        />

        {isEdit ? (
          <>
            <SelectField
              label="Estado"
              value={form.estadoUsuario}
              onChange={(value) => setField("estadoUsuario", value)}
              options={ESTADO_OPTIONS}
              error={fieldErrors.estadoUsuario}
            />
            <Text style={styles.hint}>
              La contraseña no se actualiza aquí. Usa Cambiar contraseña para el usuario autenticado.
            </Text>
          </>
        ) : (
          <FormField
            label="Contraseña"
            value={form.password}
            onChangeText={(value) => setField("password", value)}
            maxLength={200}
            secureTextEntry
            autoCapitalize="none"
            error={fieldErrors.password}
            helpText="Solo se solicita al crear el usuario."
          />
        )}
      </AdminDetailSection>

      {isEdit ? (
        <AdminDetailSection title="Roles asignados">
          <ScrollSelectField
            label="Rol disponible"
            value={selectedRolGuid}
            onChange={setSelectedRolGuid}
            options={availableRoleOptions}
            placeholder="Selecciona un rol"
          />
          <Text style={styles.hint}>
            Solo se muestran roles que todavía no están asignados al usuario.
          </Text>
          <Pressable
            style={[styles.primaryBtn, rolesActionLoading && styles.disabled]}
            disabled={rolesActionLoading || saving}
            onPress={handleAssignRole}
          >
            <Text style={styles.primaryBtnText}>Asignar rol</Text>
          </Pressable>

          {assignedRoles.length === 0 ? (
            <Text style={styles.muted}>Este usuario no tiene roles asignados.</Text>
          ) : (
            assignedRoles.map((rol) =>
              rol ? (
                <View key={String(getRolId(rol))} style={styles.roleCard}>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{rol.nombreRol || "-"}</Text>
                    <Text style={styles.roleMeta}>Estado: {rol.estadoRol || "-"}</Text>
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    disabled={rolesActionLoading || saving}
                    onPress={() => handleRemoveRole(getRolId(rol))}
                  >
                    <Text style={styles.removeText}>Quitar</Text>
                  </Pressable>
                </View>
              ) : null
            )
          )}
        </AdminDetailSection>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13 },
  muted: { color: colors.muted },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 12,
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
