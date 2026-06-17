import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getCatalogo } from "../../services/catalogoServicios.service";
import { addCargoEstadia, getEstadia } from "../../services/estadias.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList, ensureLoadedEntity } from "../../utils/adminCollection";
import {
  buildCargoEstadiaPayload,
  validateCargoEstadiaForm,
} from "../../utils/cargosEstadia";
import { formatCatalogoLabel } from "../../utils/catalogo";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";
const EMPTY_FORM = {
  catalogoGuid: "",
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
    if (bootstrapping || !isAuthenticated || !estadiaId) return;
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

  const setField = (key, value) => {
    const numericSanitizers = {
      cantidad: sanitizeOptionalDigits,
      precioUnitario: sanitizeDecimalInput,
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

  const validate = () => validateCargoEstadiaForm(form);

  const onSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

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
