import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  createUsuario,
  getUsuario,
  updateUsuario,
} from "../../services/usuarios.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { PERSON_NAME_REGEX, USER_STATES } from "../../../../src/utils/constraints";
import { validateUsuarioForm } from "../../utils/usuarios";
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

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsuario(id);
        setForm({
          username: data.username ?? "",
          nombres: data.nombres ?? "",
          apellidos: data.apellidos ?? "",
          correo: data.correo ?? "",
          password: "",
          estadoUsuario: data.estadoUsuario ?? "ACT",
          rowVersion: data.rowVersion ?? null,
        });
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el usuario."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => {
    if ((key === "nombres" || key === "apellidos") && value && !PERSON_NAME_REGEX.test(value)) {
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    const errors = validateUsuarioForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

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
        Alert.alert("Usuario", "Usuario creado.", [
          {
            text: "Asignar roles",
            onPress: () =>
              navigation.replace("AdminUsuarioRoles", {
                id: created?.usuarioGuid ?? id,
              }),
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
      loading={loading || bootstrapping}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >

      <FormField
        label="Username"
        value={form.username}
        onChangeText={(value) => setField("username", value)}
        maxLength={15}
        autoCapitalize="none"
        error={fieldErrors.username}
      />
      <FormField
        label="Nombres"
        value={form.nombres}
        onChangeText={(value) => setField("nombres", value)}
        maxLength={30}
        error={fieldErrors.nombres}
      />
      <FormField
        label="Apellidos"
        value={form.apellidos}
        onChangeText={(value) => setField("apellidos", value)}
        maxLength={30}
        error={fieldErrors.apellidos}
      />
      <FormField
        label="Correo"
        value={form.correo}
        onChangeText={(value) => setField("correo", value)}
        maxLength={120}
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
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("AdminUsuarioRoles", { id })}
          >
            Gestionar roles del usuario
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
        />
      )}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 13 },
  link: { color: colors.primary, fontWeight: "700", marginTop: 4 },
});
