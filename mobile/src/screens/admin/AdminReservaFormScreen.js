import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
import DateField from "../../components/admin/DateField";
import FormField from "../../components/admin/FormField";
import ScrollSelectField from "../../components/admin/ScrollSelectField";
import SelectField from "../../components/admin/SelectField";
import SwitchField from "../../components/admin/SwitchField";
import useRequireAuth from "../../hooks/useRequireAuth";
import { getClientes } from "../../services/clientes.service";
import { getHabitacionesDisponiblesPorSucursal } from "../../services/habitaciones.service";
import { createReserva } from "../../services/reservas.service";
import { getSucursales } from "../../services/sucursales.service";
import { getTarifas } from "../../services/tarifas.service";
import { extractApiErrorMessage } from "../../../../src/shared/utils/api";
import { RESERVA_CANALES } from "../../../../src/utils/constraints";
import { getClienteDisplayName } from "../../utils/clientes";
import { normalizeAdminList, pickGuid } from "../../utils/adminCollection";
import {
  sanitizeDecimalInput,
  sanitizeOptionalDigits,
} from "../../utils/numeric";
import {
  addDaysToIsoDate,
  buildReservaLineaPayload,
  getLocalDateMin,
  isValidGuid,
  validateReservaForm,
} from "../../utils/reservas";
import { colors } from "../../styles/theme";
import { formatSucursalLabel } from "../../utils/sucursales";
import { formatTarifaLabel } from "../../utils/tarifas";
import { formatHabitacionDisponibleLabel } from "../../utils/habitaciones";

const createEmptyLinea = () => ({
  habitacionGuid: "",
  tarifaGuid: "",
  numAdultos: "1",
  numNinos: "0",
  precioNocheAplicado: "",
});

const EMPTY_FORM = {
  clienteGuid: "",
  sucursalGuid: "",
  fechaInicio: "",
  fechaFin: "",
  origenCanalReserva: "ADMIN",
  observaciones: "",
  esWalkin: false,
  habitaciones: [createEmptyLinea()],
};

export default function AdminReservaFormScreen({ navigation }) {
  const { bootstrapping, isAuthenticated } = useRequireAuth(navigation);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [loadingHabitaciones, setLoadingHabitaciones] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [lineFieldErrors, setLineFieldErrors] = useState([]);

  const minFechaInicio = getLocalDateMin();
  const minFechaFin = form.fechaInicio
    ? addDaysToIsoDate(form.fechaInicio, 1)
    : minFechaInicio;

  const fechasValidas = useMemo(() => {
    if (!form.fechaInicio || !form.fechaFin) return false;
    return form.fechaFin > form.fechaInicio;
  }, [form.fechaInicio, form.fechaFin]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    Promise.all([
      getClientes({ pagina: 1, limite: 100 }),
      getSucursales({ pagina: 1, limite: 100 }),
      getTarifas({ pagina: 1, limite: 200 }),
    ])
      .then(([cRes, sRes, tRes]) => {
        setClientes(normalizeAdminList(cRes).items);
        setSucursales(normalizeAdminList(sRes).items);
        setTarifas(normalizeAdminList(tRes).items);
      })
      .catch(() => {
        setClientes([]);
        setSucursales([]);
        setTarifas([]);
      });
  }, [bootstrapping, isAuthenticated]);

  const loadHabitaciones = useCallback(async () => {
    if (!isValidGuid(form.sucursalGuid) || !fechasValidas) {
      setHabitacionesDisponibles([]);
      return;
    }
    setLoadingHabitaciones(true);
    try {
      const items = await getHabitacionesDisponiblesPorSucursal({
        sucursalGuid: form.sucursalGuid,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      });
      setHabitacionesDisponibles(items);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudieron cargar habitaciones."));
      setHabitacionesDisponibles([]);
    } finally {
      setLoadingHabitaciones(false);
    }
  }, [form.sucursalGuid, form.fechaInicio, form.fechaFin, fechasValidas]);

  useEffect(() => {
    loadHabitaciones();
  }, [loadHabitaciones]);

  const tarifasPorSucursal = useMemo(() => {
    if (!isValidGuid(form.sucursalGuid)) return [];
    return tarifas.filter(
      (t) =>
        (t.sucursalGuid === form.sucursalGuid ||
          String(t.idSucursal) ===
            String(
              sucursales.find(
                (s) => pickGuid(s, "sucursalGuid", "sucursal_guid") === form.sucursalGuid
              )?.idSucursal
            )) &&
        (t.estadoTarifa ?? "ACT") === "ACT"
    );
  }, [tarifas, form.sucursalGuid, sucursales]);

  const clienteOptions = useMemo(
    () =>
      clientes.map((c) => ({
        value: pickGuid(c, "clienteGuid", "cliente_guid"),
        label: getClienteDisplayName(c),
      })),
    [clientes]
  );

  const sucursalOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        value: pickGuid(s, "sucursalGuid", "sucursal_guid"),
        label: formatSucursalLabel(s),
      })),
    [sucursales]
  );

  const tarifaOptions = useMemo(
    () =>
      tarifasPorSucursal.map((t) => ({
        value: pickGuid(t, "tarifaGuid", "tarifa_guid"),
        label: formatTarifaLabel(t),
      })),
    [tarifasPorSucursal]
  );

  const setField = (key, value) => {
    if (key === "sucursalGuid") {
      setForm((prev) => ({
        ...prev,
        sucursalGuid: value,
        habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
      }));
      return;
    }
    if (key === "fechaInicio") {
      setForm((prev) => {
        if (!value) {
          return {
            ...prev,
            fechaInicio: "",
            fechaFin: "",
            habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
          };
        }

        return {
          ...prev,
          fechaInicio: value,
          fechaFin: prev.fechaFin && prev.fechaFin <= value ? "" : prev.fechaFin,
          habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
        };
      });
      return;
    }
    if (key === "fechaFin") {
      setForm((prev) => ({
        ...prev,
        fechaFin: value,
        habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateLinea = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.map((linea, i) =>
        i === index ? { ...linea, ...patch } : linea
      ),
    }));
  };

  const addLinea = () =>
    setForm((prev) => ({
      ...prev,
      habitaciones: [...prev.habitaciones, createEmptyLinea()],
    }));

  const removeLinea = (index) =>
    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.filter((_, i) => i !== index),
    }));

  const getHabitacionesParaLinea = (lineIndex) => {
    const current = form.habitaciones[lineIndex]?.habitacionGuid;
    const used = form.habitaciones
      .map((l, i) => (i === lineIndex ? "" : l.habitacionGuid))
      .filter(isValidGuid);
    return habitacionesDisponibles.filter(
      (h) => h.habitacionGuid === current || !used.includes(h.habitacionGuid)
    );
  };

  const validate = () => validateReservaForm(form, { minFechaInicio });

  const onSubmit = async () => {
    const { formErrors, lineErrors, hasLineErrors } = validate();
    setFieldErrors(formErrors);
    setLineFieldErrors(lineErrors);
    if (Object.keys(formErrors).length || hasLineErrors) {
      const firstFormError = formErrors.clienteGuid
        ? "Selecciona un cliente válido."
        : formErrors.sucursalGuid
          ? "Selecciona una sucursal válida."
          : formErrors.fechaInicio || formErrors.fechaFin || formErrors.habitaciones;

      if (firstFormError) {
        Alert.alert("Revisa el formulario", firstFormError);
      }
      return;
    }

    setSaving(true);
    setError("");
    try {
      const habitaciones = form.habitaciones.map((linea) =>
        buildReservaLineaPayload(linea, {
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
        })
      );

      await createReserva({
        clienteGuid: form.clienteGuid,
        sucursalGuid: form.sucursalGuid,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        origenCanalReserva: form.origenCanalReserva,
        observaciones: form.observaciones.trim() || null,
        esWalkin: form.esWalkin,
        habitaciones,
      });

      Alert.alert("Guardado", "Reserva creada.");
      navigation.goBack();
    } catch (err) {
      setError(extractApiErrorMessage(err, err.message || "No se pudo crear la reserva."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormScreen
      title="Nueva reserva"
      subtitle="Canal admin · selecciona fechas antes de asignar habitaciones"
      submitLabel="Crear reserva"
      onSubmit={onSubmit}
      onCancel={() => navigation.goBack()}
      saving={saving}
      error={error}
    >

      <ScrollSelectField
        label="Cliente"
        value={form.clienteGuid}
        options={[{ value: "", label: "Seleccionar cliente" }, ...clienteOptions]}
        onChange={(v) => setField("clienteGuid", v)}
        error={fieldErrors.clienteGuid}
      />

      <ScrollSelectField
        label="Sucursal"
        value={form.sucursalGuid}
        options={[{ value: "", label: "Seleccionar sucursal" }, ...sucursalOptions]}
        onChange={(v) => setField("sucursalGuid", v)}
        error={fieldErrors.sucursalGuid}
      />

      <DateField
        label="Fecha inicio"
        value={form.fechaInicio}
        onChange={(value) => setField("fechaInicio", value)}
        minDate={minFechaInicio}
        error={fieldErrors.fechaInicio}
      />
      <DateField
        label="Fecha fin"
        value={form.fechaFin}
        onChange={(value) => setField("fechaFin", value)}
        minDate={minFechaFin}
        error={fieldErrors.fechaFin}
      />

      <SelectField
        label="Canal"
        value={form.origenCanalReserva}
        options={RESERVA_CANALES.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setField("origenCanalReserva", v)}
      />
      <SwitchField label="Walk-in" value={form.esWalkin} onValueChange={(v) => setField("esWalkin", v)} />
      <FormField
        label="Observaciones"
        value={form.observaciones}
        onChangeText={(v) => setField("observaciones", v)}
        multiline
        maxLength={2000}
        error={fieldErrors.observaciones}
      />

      {fieldErrors.habitaciones ? (
        <Text style={styles.lineError}>{fieldErrors.habitaciones}</Text>
      ) : null}

      {form.habitaciones.map((linea, index) => {
        const lineErrors = lineFieldErrors[index] ?? {};
        const habOptions = getHabitacionesParaLinea(index).map((h) => ({
          value: h.habitacionGuid,
          label: formatHabitacionDisponibleLabel(h),
        }));

        return (
          <AdminDetailSection key={`linea-${index}`} title={`Habitación ${index + 1}`}>
            {loadingHabitaciones ? (
              <Text style={styles.muted}>Cargando disponibilidad...</Text>
            ) : (
              <ScrollSelectField
                label="Habitación disponible"
                value={linea.habitacionGuid}
                options={[{ value: "", label: "Seleccionar" }, ...habOptions]}
                onChange={(v) => {
                  const hab = habitacionesDisponibles.find((h) => h.habitacionGuid === v);
                  updateLinea(index, {
                    habitacionGuid: v,
                    precioNocheAplicado:
                      linea.precioNocheAplicado ||
                      (hab?.precioBase != null ? String(hab.precioBase) : ""),
                  });
                }}
                error={lineErrors.habitacionGuid}
                emptyLabel={
                  !fechasValidas
                    ? "Indica fechas válidas"
                    : "No hay habitaciones disponibles"
                }
              />
            )}
            <ScrollSelectField
              label="Tarifa"
              value={linea.tarifaGuid}
              options={[{ value: "", label: "Seleccionar tarifa" }, ...tarifaOptions]}
              onChange={(v) => {
                const tarifa = tarifasPorSucursal.find(
                  (t) => pickGuid(t, "tarifaGuid", "tarifa_guid") === v
                );
                updateLinea(index, {
                  tarifaGuid: v,
                  precioNocheAplicado:
                    tarifa?.precioPorNoche != null
                      ? String(tarifa.precioPorNoche)
                      : linea.precioNocheAplicado,
                });
              }}
              error={lineErrors.tarifaGuid}
            />
            <FormField
              label="Adultos"
              value={linea.numAdultos}
              onChangeText={(v) => updateLinea(index, { numAdultos: sanitizeOptionalDigits(v) })}
              keyboardType="numeric"
              error={lineErrors.numAdultos}
            />
            <FormField
              label="Niños"
              value={linea.numNinos}
              onChangeText={(v) => updateLinea(index, { numNinos: sanitizeOptionalDigits(v) })}
              keyboardType="numeric"
              error={lineErrors.numNinos}
            />
            <FormField
              label="Precio/noche"
              value={linea.precioNocheAplicado}
              onChangeText={(v) =>
                updateLinea(index, { precioNocheAplicado: sanitizeDecimalInput(v) })
              }
              keyboardType="decimal-pad"
              error={lineErrors.precioNocheAplicado}
            />
            {form.habitaciones.length > 1 ? (
              <Pressable style={styles.removeBtn} onPress={() => removeLinea(index)}>
                <Text style={styles.removeText}>Quitar línea</Text>
              </Pressable>
            ) : null}
          </AdminDetailSection>
        );
      })}

      <Pressable style={styles.addLineBtn} onPress={addLinea}>
        <Text style={styles.addLineText}>Agregar habitación</Text>
      </Pressable>
    </AdminFormScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  lineError: { color: colors.danger, fontWeight: "600", marginBottom: 4 },
  addLineBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  addLineText: { color: colors.onPrimary, fontWeight: "800" },
  removeBtn: { alignSelf: "flex-start" },
  removeText: { color: colors.danger, fontWeight: "700" },
});
