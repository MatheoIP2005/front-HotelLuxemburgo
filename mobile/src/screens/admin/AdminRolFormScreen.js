import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { createRol, getRol, updateRol } from "../../services/roles.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS, ROLE_STATES } from "../../../../src/utils/constraints";
import { validateRolForm } from "../../utils/roles";
import { ensureLoadedEntity } from "../../utils/adminCollection";
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
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el rol."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    const errors = validateRolForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

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
        Alert.alert("Rol", "Rol creado.", [
          {
            text: "Permisos",
            onPress: () =>
              navigation.replace("AdminRolPermisos", { id: created?.rolGuid ?? id }),
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
      loading={loading || bootstrapping}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >

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
      />

      {isEdit ? (
        <>
          <SelectField
            label="Estado"
            value={form.estadoRol}
            onChange={(value) => setField("estadoRol", value)}
            options={ESTADO_OPTIONS}
            error={fieldErrors.estadoRol}
          />
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("AdminRolPermisos", { id })}
          >
            Gestionar permisos del rol
          </Text>
        </>
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontWeight: "600" },
  link: { color: colors.primary, fontWeight: "700", marginTop: 4 },
});
