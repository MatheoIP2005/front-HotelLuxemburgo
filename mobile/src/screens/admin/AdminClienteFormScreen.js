import { useEffect, useState } from "react";
import { Alert } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  createCliente,
  getCliente,
  getClientes,
  updateCliente,
} from "../../services/clientes.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { normalizeTipoIdentificacion } from "../../../../src/shared/utils/constraints";
import {
  CLIENT_KIND_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
} from "../../../../src/utils/constraints";
import { validateClienteForm } from "../../utils/clientes";
import { normalizeAdminList } from "../../utils/adminCollection";

const EMPTY_FORM = {
  tipoIdentificacion: "CED",
  numeroIdentificacion: "",
  nombres: "",
  apellidos: "",
  razonSocial: "NAT",
  correo: "",
  telefono: "",
  direccion: "",
  estado: "ACT",
  rowVersion: null,
};

export default function AdminClienteFormScreen({ navigation, route }) {
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
        const data = await getCliente(id);
        setForm({
          tipoIdentificacion: normalizeTipoIdentificacion(data.tipoIdentificacion),
          numeroIdentificacion: data.numeroIdentificacion ?? "",
          nombres: data.nombres ?? "",
          apellidos: data.apellidos ?? "",
          razonSocial: data.razonSocial ?? "NAT",
          correo: data.correo ?? "",
          telefono: data.telefono ?? "",
          direccion: data.direccion ?? "",
          estado: data.estado ?? "ACT",
          rowVersion: data.rowVersion ?? null,
        });
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el cliente."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    const errors = validateClienteForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const tipoIdentificacion = normalizeTipoIdentificacion(form.tipoIdentificacion);
      const tipoCliente = form.razonSocial || "NAT";
      const payload = {
        tipoIdentificacion,
        numeroIdentificacion:
          tipoIdentificacion === "PAS"
            ? form.numeroIdentificacion.trim().toUpperCase()
            : form.numeroIdentificacion.trim(),
        nombres: form.nombres.trim(),
        apellidos: tipoCliente === "EMP" ? null : form.apellidos.trim(),
        razonSocial: tipoCliente,
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        ...(isEdit ? { estado: form.estado, rowVersion: form.rowVersion } : {}),
      };

      if (!isEdit) {
        const response = await getClientes({ pagina: 1, limite: 500 });
        const clientes = normalizeAdminList(response).items;
        const numero = payload.numeroIdentificacion;
        const correo = payload.correo.toLowerCase();
        if (clientes.some((c) => String(c.numeroIdentificacion).trim() === numero)) {
          setFieldErrors((prev) => ({
            ...prev,
            numeroIdentificacion: `La identificación '${numero}' ya está registrada.`,
          }));
          return;
        }
        if (
          clientes.some((c) => String(c.correo || "").trim().toLowerCase() === correo)
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            correo: `El correo '${payload.correo}' ya está registrado.`,
          }));
          return;
        }
        await createCliente(payload);
      } else {
        await updateCliente(id, payload);
      }

      Alert.alert("Guardado", isEdit ? "Cliente actualizado." : "Cliente creado.");
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminFormScreen
        title={isEdit ? "Editar cliente" : "Nuevo cliente"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  const isEmpresa = form.razonSocial === "EMP";

  return (
    <AdminFormScreen
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <SelectField
        label="Tipo identificación"
        value={form.tipoIdentificacion}
        options={IDENTIFICATION_TYPE_OPTIONS}
        onChange={(v) => setField("tipoIdentificacion", v)}
      />
      <SelectField
        label="Tipo cliente"
        value={form.razonSocial}
        options={CLIENT_KIND_OPTIONS}
        onChange={(v) => setField("razonSocial", v)}
      />
      <FormField
        label="Número identificación"
        value={form.numeroIdentificacion}
        onChangeText={(v) => setField("numeroIdentificacion", v)}
        autoCapitalize={form.tipoIdentificacion === "PAS" ? "characters" : "none"}
        keyboardType={form.tipoIdentificacion === "PAS" ? "default" : "numeric"}
        error={fieldErrors.numeroIdentificacion}
      />
      <FormField
        label={isEmpresa ? "Razón social" : "Nombres"}
        value={form.nombres}
        onChangeText={(v) => setField("nombres", v)}
        error={fieldErrors.nombres}
      />
      {!isEmpresa ? (
        <FormField
          label="Apellidos"
          value={form.apellidos}
          onChangeText={(v) => setField("apellidos", v)}
          error={fieldErrors.apellidos}
        />
      ) : null}
      <FormField
        label="Correo"
        value={form.correo}
        onChangeText={(v) => setField("correo", v)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={fieldErrors.correo}
      />
      <FormField
        label="Teléfono"
        value={form.telefono}
        onChangeText={(v) => setField("telefono", v)}
        keyboardType="phone-pad"
        error={fieldErrors.telefono}
      />
      <FormField
        label="Dirección"
        value={form.direccion}
        onChangeText={(v) => setField("direccion", v)}
        multiline
        error={fieldErrors.direccion}
      />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estado}
          options={[
            { value: "ACT", label: "ACT" },
            { value: "INA", label: "INA" },
          ]}
          onChange={(v) => setField("estado", v)}
        />
      ) : null}
    </AdminFormScreen>
  );
}
