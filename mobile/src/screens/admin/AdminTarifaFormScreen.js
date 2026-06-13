import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getSucursales } from "../../services/sucursales.service";
import { getTiposHabitacion } from "../../services/tiposHabitacion.service";
import { createTarifa, getTarifa, updateTarifa } from "../../services/tarifas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { TARIFA_CANALES, TARIFA_ESTADOS } from "../../../../src/utils/constraints";
import { normalizeAdminList } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

const today = () => new Date().toISOString().slice(0, 10);

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

const validate = (form, isEdit) => {
  const errors = {};
  if (!form.codigoTarifa.trim()) errors.codigoTarifa = "Código obligatorio.";
  if (!form.nombreTarifa.trim()) errors.nombreTarifa = "Nombre obligatorio.";
  if (!form.idSucursal || Number(form.idSucursal) <= 0) errors.idSucursal = "Sucursal obligatoria.";
  if (!form.idTipoHabitacion || Number(form.idTipoHabitacion) <= 0) {
    errors.idTipoHabitacion = "Tipo obligatorio.";
  }
  if (!form.fechaInicio) errors.fechaInicio = "Fecha inicio obligatoria.";
  if (!form.fechaFin) errors.fechaFin = "Fecha fin obligatoria.";
  if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
    errors.fechaFin = "Fin debe ser >= inicio.";
  }
  if (!form.precioPorNoche || Number(form.precioPorNoche) <= 0) {
    errors.precioPorNoche = "Precio > 0.";
  }
  if (isEdit && !TARIFA_ESTADOS.includes(form.estadoTarifa)) {
    errors.estadoTarifa = "Estado inválido.";
  }
  return errors;
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

  const sucursalOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        value: String(s.idSucursal ?? s.id ?? ""),
        label: `${s.nombreSucursal} (${s.codigoSucursal})`,
      })),
    [sucursales]
  );

  const tipoOptions = useMemo(
    () =>
      tipos.map((t) => ({
        value: String(t.idTipoHabitacion ?? t.id ?? ""),
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
        const data = await getTarifa(id);
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

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    const errors = validate(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        codigoTarifa: form.codigoTarifa,
        nombreTarifa: form.nombreTarifa,
        idSucursal: Number(form.idSucursal),
        idTipoHabitacion: Number(form.idTipoHabitacion),
        canalTarifa: form.canalTarifa,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        precioPorNoche: Number(form.precioPorNoche),
        porcentajeIva: Number(form.porcentajeIva),
        minNoches: Number(form.minNoches),
        maxNoches: form.maxNoches === "" ? null : Number(form.maxNoches),
        prioridad: Number(form.prioridad),
        permitePortalPublico: form.permitePortalPublico,
        ...(isEdit ? { estadoTarifa: form.estadoTarifa, rowVersion: form.rowVersion } : {}),
      };
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
      subtitle={`Vigencia desde ${today()}`}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <FormField label="Código" value={form.codigoTarifa} onChangeText={(v) => setField("codigoTarifa", v)} error={fieldErrors.codigoTarifa} />
      <FormField label="Nombre" value={form.nombreTarifa} onChangeText={(v) => setField("nombreTarifa", v)} error={fieldErrors.nombreTarifa} />
      <SelectField
        label="Sucursal"
        value={form.idSucursal}
        options={[{ value: "", label: "Seleccionar" }, ...sucursalOptions]}
        onChange={(v) => setField("idSucursal", v)}
      />
      {fieldErrors.idSucursal ? <Text style={styles.error}>{fieldErrors.idSucursal}</Text> : null}
      <SelectField
        label="Tipo habitación"
        value={form.idTipoHabitacion}
        options={[{ value: "", label: "Seleccionar" }, ...tipoOptions]}
        onChange={(v) => setField("idTipoHabitacion", v)}
      />
      {fieldErrors.idTipoHabitacion ? (
        <Text style={styles.error}>{fieldErrors.idTipoHabitacion}</Text>
      ) : null}
      <SelectField
        label="Canal"
        value={form.canalTarifa}
        options={TARIFA_CANALES.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setField("canalTarifa", v)}
      />
      <FormField label="Fecha inicio (YYYY-MM-DD)" value={form.fechaInicio} onChangeText={(v) => setField("fechaInicio", v)} error={fieldErrors.fechaInicio} />
      <FormField label="Fecha fin (YYYY-MM-DD)" value={form.fechaFin} onChangeText={(v) => setField("fechaFin", v)} error={fieldErrors.fechaFin} />
      <FormField label="Precio/noche" value={form.precioPorNoche} onChangeText={(v) => setField("precioPorNoche", v)} keyboardType="decimal-pad" error={fieldErrors.precioPorNoche} />
      <FormField label="% IVA" value={form.porcentajeIva} onChangeText={(v) => setField("porcentajeIva", v)} keyboardType="decimal-pad" />
      <FormField label="Mín noches" value={form.minNoches} onChangeText={(v) => setField("minNoches", v)} keyboardType="numeric" />
      <FormField label="Máx noches" value={form.maxNoches} onChangeText={(v) => setField("maxNoches", v)} keyboardType="numeric" />
      <FormField label="Prioridad" value={form.prioridad} onChangeText={(v) => setField("prioridad", v)} keyboardType="numeric" />
      <SwitchField label="Portal público" value={form.permitePortalPublico} onValueChange={(v) => setField("permitePortalPublico", v)} />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estadoTarifa}
          options={TARIFA_ESTADOS.map((e) => ({ value: e, label: e }))}
          onChange={(v) => setField("estadoTarifa", v)}
        />
      ) : null}
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700", fontSize: 12 },
});
