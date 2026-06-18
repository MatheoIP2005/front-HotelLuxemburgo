import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import DateField from "../../components/admin/DateField";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getSucursales } from "../../services/sucursales.service";
import { getTiposHabitacion } from "../../services/tiposHabitacion.service";
import { createTarifa, getTarifa, updateTarifa } from "../../services/tarifas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { TARIFA_CANALES, TARIFA_ESTADOS } from "../../../../src/utils/constraints";
import { normalizeAdminList, ensureLoadedEntity, FORM_VALIDATION_BANNER } from "../../utils/adminCollection";
import { getTodayIsoDate } from "../../utils/booking";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";
import { buildTarifaPayload, formatTarifaLabel, validateTarifaForm } from "../../utils/tarifas";
import { formatSucursalLabel } from "../../utils/sucursales";
import { formatTipoHabitacionLabel } from "../../utils/tiposHabitacion";

const TARIFA_LIMITS = {
  codigo: 30,
  nombre: 150,
};

const EMPTY_FORM = {
  codigoTarifa: "",
  nombreTarifa: "",
  idSucursal: "",
  idTipoHabitacion: "",
  canalTarifa: "TODOS",
  fechaInicio: "",
  fechaFin: "",
  precioPorNoche: "",
  porcentajeIva: "15",
  minNoches: "1",
  maxNoches: "",
  prioridad: "1",
  permitePortalPublico: true,
  estadoTarifa: "ACT",
  rowVersion: null,
};

export default function AdminTarifaFormScreen({ navigation, route }) {
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
  const minLocalDate = useMemo(() => getTodayIsoDate(), []);
  const minFechaFin = form.fechaInicio || minLocalDate;

  const sucursalOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        value: String(s?.idSucursal ?? s?.id ?? ""),
        label: formatSucursalLabel(s),
      })),
    [sucursales]
  );

  const tipoOptions = useMemo(
    () =>
      tipos.map((t) => ({
        value: String(t?.idTipoHabitacion ?? t?.id ?? ""),
        label: formatTipoHabitacionLabel(t),
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
        const data = await getTarifa(id);
        if (!ensureLoadedEntity(data, setError, "Tarifa no encontrada.")) return;
        setForm({
          codigoTarifa: data.codigoTarifa ?? "",
          nombreTarifa: data.nombreTarifa ?? "",
          idSucursal: String(data.idSucursal ?? ""),
          idTipoHabitacion: String(data.idTipoHabitacion ?? ""),
          canalTarifa: data.canalTarifa ?? "TODOS",
          fechaInicio: String(data.fechaInicio ?? "").slice(0, 10),
          fechaFin: String(data.fechaFin ?? "").slice(0, 10),
          precioPorNoche: String(data.precioPorNoche ?? ""),
          porcentajeIva: String(data.porcentajeIva ?? "15"),
          minNoches: String(data.minNoches ?? "1"),
          maxNoches: data.maxNoches != null ? String(data.maxNoches) : "",
          prioridad: String(data.prioridad ?? "1"),
          permitePortalPublico: data.permitePortalPublico ?? true,
          estadoTarifa: data.estadoTarifa ?? "ACT",
          rowVersion: data.rowVersion ?? null,
        });
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar la tarifa."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => {
    if (key === "fechaInicio") {
      setForm((prev) => {
        if (!value) {
          return { ...prev, fechaInicio: "", fechaFin: "" };
        }

        return {
          ...prev,
          fechaInicio: value,
          fechaFin: prev.fechaFin && prev.fechaFin < value ? "" : prev.fechaFin,
        };
      });
      return;
    }

    const numericSanitizers = {
      precioPorNoche: sanitizeDecimalInput,
      porcentajeIva: sanitizeDecimalInput,
      minNoches: sanitizeOptionalDigits,
      maxNoches: sanitizeOptionalDigits,
      prioridad: sanitizeOptionalDigits,
    };

    const nextValue = numericSanitizers[key] ? numericSanitizers[key](value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSubmit = async () => {
    const errors = validateTarifaForm(form, isEdit, minLocalDate);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildTarifaPayload(form, isEdit);
      if (isEdit) await updateTarifa(id, payload);
      else await createTarifa(payload);
      Alert.alert("Guardado", isEdit ? "Tarifa actualizada." : "Tarifa creada.");
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
        title={isEdit ? "Editar tarifa" : "Nueva tarifa"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title={isEdit ? "Editar tarifa" : "Nueva tarifa"}
      subtitle={`Vigencia desde ${minLocalDate}`}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <AdminDetailSection title="Identificación">
      <FormField label="Código" value={form.codigoTarifa} onChangeText={(v) => setField("codigoTarifa", v)} maxLength={TARIFA_LIMITS.codigo} error={fieldErrors.codigoTarifa} />
      <FormField label="Nombre" value={form.nombreTarifa} onChangeText={(v) => setField("nombreTarifa", v)} maxLength={TARIFA_LIMITS.nombre} error={fieldErrors.nombreTarifa} />
      <ScrollSelectField
        label="Sucursal"
        value={form.idSucursal}
        options={[{ value: "", label: "Seleccionar" }, ...sucursalOptions]}
        onChange={(v) => setField("idSucursal", v)}
        error={fieldErrors.idSucursal}
      />
      <ScrollSelectField
        label="Tipo habitación"
        value={form.idTipoHabitacion}
        options={[{ value: "", label: "Seleccionar" }, ...tipoOptions]}
        onChange={(v) => setField("idTipoHabitacion", v)}
        error={fieldErrors.idTipoHabitacion}
      />
      <SelectField
        label="Canal"
        value={form.canalTarifa}
        options={TARIFA_CANALES.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setField("canalTarifa", v)}
      />
      </AdminDetailSection>

      <AdminDetailSection title="Vigencia y precio">
      <DateField
        label="Fecha inicio"
        value={form.fechaInicio}
        onChange={(value) => setField("fechaInicio", value)}
        minDate={minLocalDate}
        error={fieldErrors.fechaInicio}
      />
      <DateField
        label="Fecha fin"
        value={form.fechaFin}
        onChange={(value) => setField("fechaFin", value)}
        minDate={minFechaFin}
        error={fieldErrors.fechaFin}
      />
      <FormField label="Precio/noche" value={form.precioPorNoche} onChangeText={(v) => setField("precioPorNoche", v)} keyboardType="decimal-pad" error={fieldErrors.precioPorNoche} />
      <FormField label="% IVA" value={form.porcentajeIva} onChangeText={(v) => setField("porcentajeIva", v)} keyboardType="decimal-pad" error={fieldErrors.porcentajeIva} />
      <FormField label="Mín noches" value={form.minNoches} onChangeText={(v) => setField("minNoches", v)} keyboardType="numeric" error={fieldErrors.minNoches} />
      <FormField label="Máx noches" value={form.maxNoches} onChangeText={(v) => setField("maxNoches", v)} keyboardType="numeric" error={fieldErrors.maxNoches} />
      <FormField label="Prioridad" value={form.prioridad} onChangeText={(v) => setField("prioridad", v)} keyboardType="numeric" error={fieldErrors.prioridad} />
      </AdminDetailSection>

      <AdminDetailSection title="Opciones">
      <SwitchField label="Portal público" value={form.permitePortalPublico} onValueChange={(v) => setField("permitePortalPublico", v)} />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estadoTarifa}
          options={TARIFA_ESTADOS.map((e) => ({ value: e, label: e }))}
          onChange={(v) => setField("estadoTarifa", v)}
        />
      ) : null}
      </AdminDetailSection>
    </AdminFormScreen>
  );
}
