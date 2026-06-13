import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  createHabitacion,
  getHabitacion,
  updateHabitacion,
} from "../../services/habitaciones.service";
import { getSucursales } from "../../services/sucursales.service";
import { getTiposHabitacion } from "../../services/tiposHabitacion.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { HABITACION_ESTADOS } from "../../../../src/utils/constraints";
import { normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

const EMPTY_FORM = {
  sucursalGuid: "",
  tipoHabitacionGuid: "",
  numeroHabitacion: "",
  piso: "",
  precioBase: "",
  descripcionHabitacion: "",
  estadoHabitacion: "DIS",
};

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

const validate = (form, isEdit) => {
  const errors = {};
  if (!isGuid(form.sucursalGuid)) errors.sucursalGuid = "Selecciona sucursal.";
  if (!isGuid(form.tipoHabitacionGuid)) errors.tipoHabitacionGuid = "Selecciona tipo.";
  if (!form.numeroHabitacion.trim()) errors.numeroHabitacion = "Número obligatorio.";
  if (!form.precioBase || Number(form.precioBase) <= 0) errors.precioBase = "Precio > 0.";
  if (isEdit && !HABITACION_ESTADOS.includes(form.estadoHabitacion)) {
    errors.estadoHabitacion = "Estado inválido.";
  }
  return errors;
};

export default function AdminHabitacionFormScreen({ navigation, route }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sucursales, setSucursales] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sucursalOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        value: pickGuid(s, "sucursalGuid", "sucursal_guid"),
        label: `${s.nombreSucursal} (${s.codigoSucursal})`,
      })),
    [sucursales]
  );

  const tipoOptions = useMemo(
    () =>
      tipos.map((t) => ({
        value: pickGuid(t, "tipoHabitacionGuid", "tipo_habitacion_guid"),
        label: `${t.nombreTipoHabitacion} (${t.codigoTipoHabitacion})`,
      })),
    [tipos]
  );

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    const loadCatalogs = async () => {
      try {
        const [sucRes, tipRes] = await Promise.all([
          getSucursales({ pagina: 1, limite: 100 }),
          getTiposHabitacion({ pagina: 1, limite: 100 }),
        ]);
        setSucursales(normalizeAdminList(sucRes).items);
        setTipos(normalizeAdminList(tipRes).items);
      } catch {
        setSucursales([]);
        setTipos([]);
      }
    };
    loadCatalogs();
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getHabitacion(id);
        setForm({
          sucursalGuid: data.sucursalGuid ?? "",
          tipoHabitacionGuid: data.tipoHabitacionGuid ?? "",
          numeroHabitacion: data.numeroHabitacion ?? "",
          piso: data.piso != null ? String(data.piso) : "",
          precioBase: String(data.precioBase ?? ""),
          descripcionHabitacion: data.descripcionHabitacion ?? "",
          estadoHabitacion: data.estadoHabitacion ?? "DIS",
        });
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar la habitación."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    const errors = validate(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        sucursalGuid: form.sucursalGuid,
        tipoHabitacionGuid: form.tipoHabitacionGuid,
        numeroHabitacion: form.numeroHabitacion,
        piso: form.piso === "" ? null : Number(form.piso),
        precioBase: Number(form.precioBase),
        descripcionHabitacion: form.descripcionHabitacion || null,
        ...(isEdit ? { estadoHabitacion: form.estadoHabitacion } : {}),
      };
      if (isEdit) await updateHabitacion(id, payload);
      else await createHabitacion(payload);
      Alert.alert("Guardado", isEdit ? "Habitación actualizada." : "Habitación creada.");
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
        title={isEdit ? "Editar habitación" : "Nueva habitación"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title={isEdit ? "Editar habitación" : "Nueva habitación"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <SelectField
        label="Sucursal"
        value={form.sucursalGuid}
        options={[{ value: "", label: "Seleccionar" }, ...sucursalOptions]}
        onChange={(v) => setField("sucursalGuid", v)}
      />
      {fieldErrors.sucursalGuid ? <Text style={styles.error}>{fieldErrors.sucursalGuid}</Text> : null}
      <SelectField
        label="Tipo habitación"
        value={form.tipoHabitacionGuid}
        options={[{ value: "", label: "Seleccionar" }, ...tipoOptions]}
        onChange={(v) => setField("tipoHabitacionGuid", v)}
      />
      {fieldErrors.tipoHabitacionGuid ? (
        <Text style={styles.error}>{fieldErrors.tipoHabitacionGuid}</Text>
      ) : null}
      <FormField
        label="Número"
        value={form.numeroHabitacion}
        onChangeText={(v) => setField("numeroHabitacion", v)}
        error={fieldErrors.numeroHabitacion}
      />
      <FormField label="Piso" value={form.piso} onChangeText={(v) => setField("piso", v)} keyboardType="numeric" />
      <FormField
        label="Precio base"
        value={form.precioBase}
        onChangeText={(v) => setField("precioBase", v)}
        keyboardType="decimal-pad"
        error={fieldErrors.precioBase}
      />
      <FormField
        label="Descripción"
        value={form.descripcionHabitacion}
        onChangeText={(v) => setField("descripcionHabitacion", v)}
        multiline
      />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estadoHabitacion}
          options={HABITACION_ESTADOS.map((e) => ({ value: e, label: e }))}
          onChange={(v) => setField("estadoHabitacion", v)}
        />
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700", fontSize: 12 },
});
