import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import AdminDetailSection from "../../components/admin/AdminDetailSection";
import AdminFormScreen from "../../components/admin/AdminFormScreen";
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
  addDaysToIsoDate,
  getLocalDateMin,
  isValidGuid,
} from "../../utils/reservas";
import { colors } from "../../styles/theme";

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
        label: `${s.nombreSucursal} (${s.codigoSucursal})`,
      })),
    [sucursales]
  );

  const tarifaOptions = useMemo(
    () =>
      tarifasPorSucursal.map((t) => ({
        value: pickGuid(t, "tarifaGuid", "tarifa_guid"),
        label: `${t.codigoTarifa} · ${t.nombreTarifa} · $${t.precioPorNoche}`,
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
      setForm((prev) => ({
        ...prev,
        fechaInicio: value,
        fechaFin: prev.fechaFin && prev.fechaFin <= value ? "" : prev.fechaFin,
        habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
      }));
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

  const validate = () => {
    const errors = {};
    if (!isValidGuid(form.clienteGuid)) errors.clienteGuid = "Selecciona cliente.";
    if (!isValidGuid(form.sucursalGuid)) errors.sucursalGuid = "Selecciona sucursal.";
    if (!form.fechaInicio) errors.fechaInicio = "Fecha inicio obligatoria.";
    if (!form.fechaFin) errors.fechaFin = "Fecha fin obligatoria.";
    if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) {
      errors.fechaFin = "Fin debe ser posterior al inicio.";
    }
    if (form.fechaInicio && form.fechaInicio < minFechaInicio) {
      errors.fechaInicio = "No se permiten fechas pasadas.";
    }
    if (!RESERVA_CANALES.includes(form.origenCanalReserva)) {
      errors.origenCanalReserva = "Canal inválido.";
    }
    return errors;
  };

  const onSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const habitaciones = form.habitaciones.map((linea, index) => {
        if (!isValidGuid(linea.habitacionGuid)) {
          throw new Error(`Selecciona habitación en línea ${index + 1}.`);
        }
        if (!isValidGuid(linea.tarifaGuid)) {
          throw new Error(`Selecciona tarifa en línea ${index + 1}.`);
        }
        const precio = Number(linea.precioNocheAplicado);
        if (!precio || precio <= 0) {
          throw new Error(`Precio inválido en línea ${index + 1}.`);
        }
        return {
          habitacionGuid: linea.habitacionGuid,
          tarifaGuid: linea.tarifaGuid,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          numAdultos: Number(linea.numAdultos) || 1,
          numNinos: Number(linea.numNinos) || 0,
          precioNocheAplicado: precio,
        };
      });

      const guids = habitaciones.map((h) => h.habitacionGuid);
      if (new Set(guids).size !== guids.length) {
        throw new Error("No repitas la misma habitación en varias líneas.");
      }
      if (habitaciones.length === 0) {
        throw new Error("Agrega al menos una habitación.");
      }

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
      />
      {fieldErrors.clienteGuid ? <Text style={styles.fieldError}>{fieldErrors.clienteGuid}</Text> : null}

      <ScrollSelectField
        label="Sucursal"
        value={form.sucursalGuid}
        options={[{ value: "", label: "Seleccionar sucursal" }, ...sucursalOptions]}
        onChange={(v) => setField("sucursalGuid", v)}
      />
      {fieldErrors.sucursalGuid ? (
        <Text style={styles.fieldError}>{fieldErrors.sucursalGuid}</Text>
      ) : null}

      <FormField
        label="Fecha inicio (YYYY-MM-DD)"
        value={form.fechaInicio}
        onChangeText={(v) => setField("fechaInicio", v)}
        placeholder={minFechaInicio}
        error={fieldErrors.fechaInicio}
      />
      <FormField
        label="Fecha fin (YYYY-MM-DD)"
        value={form.fechaFin}
        onChangeText={(v) => setField("fechaFin", v)}
        placeholder={minFechaFin}
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
      />

      {form.habitaciones.map((linea, index) => {
        const habOptions = getHabitacionesParaLinea(index).map((h) => ({
          value: h.habitacionGuid,
          label: `Hab. ${h.numeroHabitacion}${h.tipoNombre ? ` · ${h.tipoNombre}` : ""}`,
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
            />
            <FormField
              label="Adultos"
              value={linea.numAdultos}
              onChangeText={(v) => updateLinea(index, { numAdultos: v })}
              keyboardType="numeric"
            />
            <FormField
              label="Niños"
              value={linea.numNinos}
              onChangeText={(v) => updateLinea(index, { numNinos: v })}
              keyboardType="numeric"
            />
            <FormField
              label="Precio/noche"
              value={linea.precioNocheAplicado}
              onChangeText={(v) => updateLinea(index, { precioNocheAplicado: v })}
              keyboardType="decimal-pad"
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
  error: { color: colors.danger, fontWeight: "700" },
  fieldError: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  muted: { color: colors.muted },
  addLineBtn: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  addLineText: { color: "#fff", fontWeight: "800" },
  removeBtn: { alignSelf: "flex-start" },
  removeText: { color: colors.danger, fontWeight: "700" },
});
