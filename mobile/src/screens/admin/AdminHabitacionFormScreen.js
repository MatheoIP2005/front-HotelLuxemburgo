import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
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
import { HABITACION_ESTADOS, MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import {
  buildHabitacionPayload,
  validateHabitacionForm,
} from "../../utils/habitaciones";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";

const EMPTY_FORM = {
  sucursalGuid: "",
  tipoHabitacionGuid: "",
  numeroHabitacion: "",
  piso: "",
  precioBase: "",
  descripcionHabitacion: "",
  estadoHabitacion: "DIS",
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

  const setField = (key, value) => {
    const numericSanitizers = {
      piso: sanitizeOptionalDigits,
      precioBase: sanitizeDecimalInput,
    };
    const nextValue = numericSanitizers[key] ? numericSanitizers[key](value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSubmit = async () => {
    const errors = validateHabitacionForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const payload = buildHabitacionPayload(form, isEdit);
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
      <ScrollSelectField
        label="Sucursal"
        value={form.sucursalGuid}
        options={[{ value: "", label: "Seleccionar" }, ...sucursalOptions]}
        onChange={(v) => setField("sucursalGuid", v)}
        error={fieldErrors.sucursalGuid}
      />
      <ScrollSelectField
        label="Tipo habitación"
        value={form.tipoHabitacionGuid}
        options={[{ value: "", label: "Seleccionar" }, ...tipoOptions]}
        onChange={(v) => setField("tipoHabitacionGuid", v)}
        error={fieldErrors.tipoHabitacionGuid}
      />
      <FormField
        label="Número"
        value={form.numeroHabitacion}
        onChangeText={(v) => setField("numeroHabitacion", v)}
        maxLength={MAX_LENGTHS.habitacion.numero}
        error={fieldErrors.numeroHabitacion}
      />
      <FormField label="Piso" value={form.piso} onChangeText={(v) => setField("piso", v)} keyboardType="numeric" error={fieldErrors.piso} />
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
        maxLength={MAX_LENGTHS.habitacion.descripcion}
        error={fieldErrors.descripcionHabitacion}
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
