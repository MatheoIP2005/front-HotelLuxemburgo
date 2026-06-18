import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import DateField from "../../components/admin/DateField";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getCatalogo } from "../../services/catalogoServicios.service";
import { addCargoEstadia, getEstadia } from "../../services/estadias.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList, ensureLoadedEntity, FORM_VALIDATION_BANNER } from "../../utils/adminCollection";
import {
  buildCargoEstadiaPayload,
  getFechaConsumoBounds,
  validateCargoEstadiaForm,
} from "../../utils/cargosEstadia";
import { formatCatalogoLabel } from "../../utils/catalogo";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";
import { sanitizeTimeInput } from "../../utils/text";

const EMPTY_FORM = {
  catalogoGuid: "",
  fechaConsumo: "",
  fechaConsumoHora: "",
  descripcionCargo: "",
  cantidad: "1",
  precioUnitario: "",
};

export default function AdminCargoEstadiaFormScreen({ navigation, route }) {
  const estadiaId = route.params?.estadiaId;
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [catalogo, setCatalogo] = useState([]);
  const [estadia, setEstadia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    if (!estadiaId) {
      setLoading(false);
      setError("No se indicó la estadía para registrar el cargo.");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [estadiaData, catalogoRes] = await Promise.all([
          getEstadia(estadiaId),
          getCatalogo({ pagina: 1, limite: 200 }),
        ]);
        setEstadia(estadiaData);
        if (!ensureLoadedEntity(estadiaData, setError, "Estadía no encontrada.")) return;
        setCatalogo(normalizeAdminList(catalogoRes).items);
      } catch (err) {
        setError(extractApiErrorMessage(err, "No se pudo cargar datos."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bootstrapping, isAuthenticated, estadiaId]);

  const catalogoOptions = useMemo(
    () =>
      catalogo.map((item) => ({
        value: item?.catalogoGuid ?? "",
        label: formatCatalogoLabel(item),
      })),
    [catalogo]
  );

  const fechaConsumoBounds = useMemo(
    () => getFechaConsumoBounds(estadia),
    [estadia]
  );

  const setField = (key, value) => {
    const numericSanitizers = {
      cantidad: sanitizeOptionalDigits,
      precioUnitario: sanitizeDecimalInput,
      fechaConsumoHora: sanitizeTimeInput,
    };
    const nextValue = numericSanitizers[key] ? numericSanitizers[key](value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSelectCatalogo = (guid) => {
    const item = catalogo.find((c) => c.catalogoGuid === guid);
    setForm((prev) => ({
      ...prev,
      catalogoGuid: guid,
      descripcionCargo: prev.descripcionCargo || item?.nombreCatalogo || "",
      precioUnitario:
        prev.precioUnitario !== ""
          ? prev.precioUnitario
          : item?.precioBase != null
            ? String(item.precioBase)
            : "",
    }));
  };

  const validate = () => validateCargoEstadiaForm(form, { estadia });

  const onSubmit = async () => {
    if (!estadiaId) {
      setError("No se indicó la estadía para registrar el cargo.");
      return;
    }

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError(FORM_VALIDATION_BANNER);
      return;
    }

    if (estadia?.estadoEstadia !== "ACT") {
      setError("Solo se pueden registrar cargos sobre estadías activas.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addCargoEstadia(estadiaId, buildCargoEstadiaPayload(form));
      Alert.alert("Guardado", "Cargo registrado.");
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo registrar el cargo."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminFormScreen
        title="Nuevo cargo"
        loading
        onCancel={() => navigation.goBack()}
      />
    );
  }

  if (!estadiaId) {
    return (
      <AdminFormScreen
        title="Nuevo cargo de estadía"
        error={error || "No se indicó la estadía para registrar el cargo."}
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <AdminFormScreen
      title="Nuevo cargo de estadía"
      subtitle={`Estadía ${String(estadiaId ?? "").slice(0, 8)}… · Estado: ${estadia?.estadoEstadia ?? "-"}`}
      submitLabel="Registrar cargo"
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >
      <ScrollSelectField
        label="Catálogo"
        value={form.catalogoGuid}
        options={[{ value: "", label: "Seleccionar" }, ...catalogoOptions]}
        onChange={onSelectCatalogo}
        error={fieldErrors.catalogoGuid}
      />
      <DateField
        label="Fecha consumo"
        value={form.fechaConsumo}
        onChange={(value) => setField("fechaConsumo", value)}
        minDate={fechaConsumoBounds.minDate}
        maxDate={fechaConsumoBounds.maxDate}
        error={fieldErrors.fechaConsumo}
      />
      <FormField
        label="Hora consumo"
        value={form.fechaConsumoHora}
        onChangeText={(v) => setField("fechaConsumoHora", v)}
        placeholder="HH:MM"
        maxLength={5}
        helpText="Opcional. Si no indicas hora, se usa 00:00."
        error={fieldErrors.fechaConsumoHora}
      />
      <FormField
        label="Descripción"
        value={form.descripcionCargo}
        onChangeText={(v) => setField("descripcionCargo", v)}
        multiline
        maxLength={MAX_LENGTHS.cargoEstadia.descripcion}
        error={fieldErrors.descripcionCargo}
      />
      <FormField
        label="Cantidad"
        value={form.cantidad}
        onChangeText={(v) => setField("cantidad", v)}
        keyboardType="numeric"
        error={fieldErrors.cantidad}
      />
      <FormField
        label="Precio unitario"
        value={form.precioUnitario}
        onChangeText={(v) => setField("precioUnitario", v)}
        keyboardType="decimal-pad"
        error={fieldErrors.precioUnitario}
      />
    </AdminFormScreen>
  );
}
