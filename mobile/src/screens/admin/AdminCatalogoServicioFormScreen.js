import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  createCatalogoItem,
  getCatalogoItem,
  updateCatalogoItem,
} from "../../services/catalogoServicios.service";
import { getSucursales } from "../../services/sucursales.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { CATALOGO_ESTADOS, CATALOGO_TIPOS, MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList } from "../../utils/adminCollection";
import { sanitizeDecimalInput } from "../../utils/numeric";
import { sanitizeTimeInput } from "../../utils/text";
import { validateCatalogoForm } from "../../utils/catalogo";

const EMPTY_FORM = {
  idSucursal: "",
  codigoCatalogo: "",
  nombreCatalogo: "",
  tipoCatalogo: "AME",
  categoriaCatalogo: "",
  descripcionCatalogo: "",
  precioBase: "0",
  aplicaIva: false,
  disponible24h: false,
  horaInicio: "",
  horaFin: "",
  iconoUrl: "",
  estadoCatalogo: "ACT",
  rowVersion: null,
};

export default function AdminCatalogoServicioFormScreen({ navigation, route }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sucursales, setSucursales] = useState([]);
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

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    getSucursales({ pagina: 1, limite: 100 })
      .then((r) => setSucursales(normalizeAdminList(r).items))
      .catch(() => setSucursales([]));
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCatalogoItem(id);
        setForm({
          idSucursal: String(data.idSucursal ?? ""),
          codigoCatalogo: data.codigoCatalogo ?? "",
          nombreCatalogo: data.nombreCatalogo ?? "",
          tipoCatalogo: data.tipoCatalogo ?? "AME",
          categoriaCatalogo: data.categoriaCatalogo ?? "",
          descripcionCatalogo: data.descripcionCatalogo ?? "",
          precioBase: String(data.precioBase ?? "0"),
          aplicaIva: Boolean(data.aplicaIva),
          disponible24h: Boolean(data.disponible24h),
          horaInicio: data.horaInicio ?? "",
          horaFin: data.horaFin ?? "",
          iconoUrl: data.iconoUrl ?? "",
          estadoCatalogo: data.estadoCatalogo ?? "ACT",
          rowVersion: data.rowVersion ?? null,
        });
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar el registro."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, id, isEdit]);

  const setField = (key, value) => {
    setForm((prev) => {
      if (key === "horaInicio" || key === "horaFin") {
        return { ...prev, [key]: sanitizeTimeInput(value) };
      }
      if (key === "precioBase") {
        return { ...prev, [key]: sanitizeDecimalInput(value) };
      }
      if (key === "tipoCatalogo") {
        return {
          ...prev,
          tipoCatalogo: value,
          precioBase: value === "AME" ? "0" : prev.precioBase,
        };
      }
      if (key === "disponible24h" && value) {
        return { ...prev, disponible24h: true, horaInicio: "", horaFin: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  const onSubmit = async () => {
    const errors = validateCatalogoForm(form, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        idSucursal: Number(form.idSucursal),
        codigoCatalogo: form.codigoCatalogo,
        nombreCatalogo: form.nombreCatalogo,
        tipoCatalogo: form.tipoCatalogo,
        categoriaCatalogo: form.categoriaCatalogo,
        descripcionCatalogo: form.descripcionCatalogo || null,
        precioBase: Number(form.precioBase),
        aplicaIva: form.aplicaIva,
        disponible24h: form.disponible24h,
        horaInicio: form.horaInicio || null,
        horaFin: form.horaFin || null,
        iconoUrl: form.iconoUrl || null,
        ...(isEdit
          ? { estadoCatalogo: form.estadoCatalogo, rowVersion: form.rowVersion }
          : {}),
      };
      if (isEdit) await updateCatalogoItem(id, payload);
      else await createCatalogoItem(payload);
      Alert.alert("Guardado", isEdit ? "Registro actualizado." : "Registro creado.");
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
        title={isEdit ? "Editar catálogo" : "Nuevo catálogo"}
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title={isEdit ? "Editar catálogo" : "Nuevo catálogo"}
      submitLabel={isEdit ? "Actualizar" : "Crear"}
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <ScrollSelectField
        label="Sucursal"
        value={form.idSucursal}
        options={[{ value: "", label: "Seleccionar" }, ...sucursalOptions]}
        onChange={(v) => setField("idSucursal", v)}
        error={fieldErrors.idSucursal}
      />
      <FormField label="Código" value={form.codigoCatalogo} onChangeText={(v) => setField("codigoCatalogo", v)} maxLength={MAX_LENGTHS.catalogo.codigo} error={fieldErrors.codigoCatalogo} />
      <FormField label="Nombre" value={form.nombreCatalogo} onChangeText={(v) => setField("nombreCatalogo", v)} maxLength={MAX_LENGTHS.catalogo.nombre} error={fieldErrors.nombreCatalogo} />
      <SelectField
        label="Tipo"
        value={form.tipoCatalogo}
        options={CATALOGO_TIPOS.map((t) => ({ value: t, label: t }))}
        onChange={(v) => setField("tipoCatalogo", v)}
        error={fieldErrors.tipoCatalogo}
      />
      <FormField label="Categoría" value={form.categoriaCatalogo} onChangeText={(v) => setField("categoriaCatalogo", v)} maxLength={MAX_LENGTHS.catalogo.categoria} error={fieldErrors.categoriaCatalogo} />
      <FormField label="Descripción" value={form.descripcionCatalogo} onChangeText={(v) => setField("descripcionCatalogo", v)} multiline maxLength={MAX_LENGTHS.catalogo.descripcion} error={fieldErrors.descripcionCatalogo} />
      <FormField label="Precio base" value={form.precioBase} onChangeText={(v) => setField("precioBase", v)} keyboardType="decimal-pad" error={fieldErrors.precioBase} />
      <SwitchField label="Aplica IVA" value={form.aplicaIva} onValueChange={(v) => setField("aplicaIva", v)} />
      <SwitchField label="Disponible 24h" value={form.disponible24h} onValueChange={(v) => setField("disponible24h", v)} />
      {!form.disponible24h ? (
        <>
          <FormField label="Hora inicio" value={form.horaInicio} onChangeText={(v) => setField("horaInicio", v)} placeholder="HH:MM" maxLength={5} error={fieldErrors.horaInicio} />
          <FormField label="Hora fin" value={form.horaFin} onChangeText={(v) => setField("horaFin", v)} placeholder="HH:MM" maxLength={5} error={fieldErrors.horaFin} />
        </>
      ) : null}
      <FormField label="URL ícono" value={form.iconoUrl} onChangeText={(v) => setField("iconoUrl", v)} autoCapitalize="none" maxLength={MAX_LENGTHS.catalogo.iconoUrl} error={fieldErrors.iconoUrl} />
      {isEdit ? (
        <SelectField
          label="Estado"
          value={form.estadoCatalogo}
          options={CATALOGO_ESTADOS.map((e) => ({ value: e, label: e }))}
          onChange={(v) => setField("estadoCatalogo", v)}
          error={fieldErrors.estadoCatalogo}
        />
      ) : null}
    </AdminFormScreen>
  );
}
