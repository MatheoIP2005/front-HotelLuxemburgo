import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getCatalogo } from "../../services/catalogoServicios.service";
import { addCargoEstadia, getEstadia } from "../../services/estadias.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { MAX_LENGTHS } from "../../../../src/utils/constraints";
import { normalizeAdminList } from "../../utils/adminCollection";
import { colors } from "../../styles/theme";

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
        value: item.catalogoGuid,
        label: `${item.nombreCatalogo} · $${Number(item.precioBase ?? 0).toFixed(2)}`,
      })),
    [catalogo]
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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

  const validate = () => {
    const errors = {};
    if (!form.catalogoGuid) errors.catalogoGuid = "Selecciona un ítem del catálogo.";
    if (!form.descripcionCargo.trim()) errors.descripcionCargo = "Descripción obligatoria.";
    else if (form.descripcionCargo.trim().length > MAX_LENGTHS.cargoEstadia.descripcion) {
      errors.descripcionCargo = "Máximo 250 caracteres.";
    }
    if (Number(form.cantidad) <= 0) errors.cantidad = "Cantidad debe ser mayor a 0.";
    if (Number(form.precioUnitario) < 0) errors.precioUnitario = "Precio no puede ser negativo.";
    return errors;
  };

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
      await addCargoEstadia(estadiaId, {
        catalogoGuid: form.catalogoGuid,
        descripcionCargo: form.descripcionCargo.trim(),
        cantidad: Number(form.cantidad),
        precioUnitario: Number(form.precioUnitario),
      });
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
      />
      {fieldErrors.catalogoGuid ? (
        <Text style={styles.fieldError}>{fieldErrors.catalogoGuid}</Text>
      ) : null}
      <FormField
        label="Descripción"
        value={form.descripcionCargo}
        onChangeText={(v) => setField("descripcionCargo", v)}
        multiline
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

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  error: { color: colors.danger, fontWeight: "700" },
  fieldError: { color: colors.danger, fontSize: 12, fontWeight: "600" },
});
