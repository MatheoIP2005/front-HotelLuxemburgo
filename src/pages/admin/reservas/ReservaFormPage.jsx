import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReserva } from "../../../services/reservas.service";
import { getClientes } from "../../../services/clientes.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getHabitacionesDisponiblesPorSucursal } from "../../../services/habitaciones.service";
import { getTarifas } from "../../../services/tarifas.service";
import { extractApiErrorMessage, normalizeCollectionPayload } from "../../../utils/api";
import MinimalDateInput from "../../../components/public/MinimalDateInput";
import styles from "../usuarios/UsuarioFormPage.module.css";

const getLocalDateMin = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const addDaysToIsoDate = (isoDate, amount) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + amount);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const createEmptyLinea = () => ({
  habitacion_id: "",
  habitacion_guid: "",
  tarifa_id: "",
  tarifa_guid: "",
  num_adultos: "1",
  num_ninos: "0",
  precio_noche_aplicado: "",
});

const EMPTY_FORM = {
  cliente_id: "",
  cliente_guid: "",
  sucursal_id: "",
  sucursal_guid: "",
  fecha_inicio: "",
  fecha_fin: "",
  origen_canal_reserva: "ADMIN",
  observaciones: "",
  es_walkin: false,
  habitaciones: [createEmptyLinea()],
};

const trimText = (value) => String(value ?? "").trim();

const isValidGuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );

const getCounterText = (value, maxLength) => `${String(value ?? "").length}/${maxLength}`;

const getDescribedBy = (helpId, errorId, errorText) =>
  errorText ? `${helpId} ${errorId}` : helpId;

const getLineFieldKey = (index, name) => `habitaciones.${index}.${name}`;

function FieldHint({ helpId, errorId, helpText, errorText, counterText }) {
  return (
    <>
      <div className={styles.fieldMeta}>
        <span id={helpId} className={styles.helpText}>
          {helpText}
        </span>
        {counterText ? <span className={styles.counterText}>{counterText}</span> : null}
      </div>
      {errorText ? (
        <span id={errorId} className={styles.errorText}>
          {errorText}
        </span>
      ) : null}
    </>
  );
}

export default function ReservaFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [catalogs, setCatalogs] = useState({
    clientes: [],
    sucursales: [],
    tarifas: [],
  });
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [loadingHabitaciones, setLoadingHabitaciones] = useState(false);
  const [habitacionesLoadError, setHabitacionesLoadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validation = useMemo(() => {
    const formErrors = {};
    const lineErrors = form.habitaciones.map((item) => {
      const currentErrors = {};
      const precioNocheAplicado = Number(item.precio_noche_aplicado);

      if (!isValidGuid(item.habitacion_guid)) {
        currentErrors.habitacion_guid = "Seleccione una habitación válida.";
      }
      if (!isValidGuid(item.tarifa_guid)) {
        currentErrors.tarifa_guid = "Seleccione una tarifa válida.";
      }
      if (!item.num_adultos || Number(item.num_adultos) <= 0) {
        currentErrors.num_adultos = "Debe ingresar al menos un adulto.";
      }
      if (item.num_ninos === "" || Number(item.num_ninos) < 0) {
        currentErrors.num_ninos = "El número de niños no puede ser negativo.";
      }
      if (!item.precio_noche_aplicado) {
        currentErrors.precio_noche_aplicado = "El precio por noche es obligatorio.";
      } else if (Number.isNaN(precioNocheAplicado) || precioNocheAplicado <= 0) {
        currentErrors.precio_noche_aplicado = "El precio por noche debe ser mayor a cero.";
      }

      return currentErrors;
    });

    if (!isValidGuid(form.cliente_guid)) {
      formErrors.cliente_guid = "Seleccione un cliente válido.";
    }
    if (!isValidGuid(form.sucursal_guid)) {
      formErrors.sucursal_guid = "Seleccione una sucursal válida.";
    }
    if (!form.fecha_inicio) {
      formErrors.fecha_inicio = "La fecha inicio es obligatoria.";
    }
    if (!form.fecha_fin) {
      formErrors.fecha_fin = "La fecha fin es obligatoria.";
    }
    if (form.fecha_inicio && form.fecha_fin) {
      const fechaInicio = new Date(`${form.fecha_inicio}T00:00:00`);
      const fechaFin = new Date(`${form.fecha_fin}T00:00:00`);

      if (fechaFin <= fechaInicio) {
        formErrors.fecha_fin = "La fecha fin debe ser posterior a la fecha inicio.";
      }
    }
    if (!["PORTAL", "ADMIN", "WALKIN"].includes(form.origen_canal_reserva)) {
      formErrors.origen_canal_reserva = "Seleccione una opción válida.";
    }
    if (form.observaciones.length > 2000) {
      formErrors.observaciones = "Las observaciones no pueden exceder 2000 caracteres.";
    }

    return { formErrors, lineErrors };
  }, [form]);

  const parseApiError = (err) => {
    const apiError = err?.response?.data;
    const details = apiError?.details ?? apiError?.errors;
    if (Array.isArray(details) && details.length > 0) {
      return `${apiError.message || apiError.error || "Solicitud inválida"}: ${details.join(" | ")}`;
    }
    return apiError?.message || apiError?.error || err?.message || "Error al guardar";
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      setError(null);

      const [clientesResult, sucursalesResult, tarifasResult] =
        await Promise.allSettled([
          getClientes({ pagina: 1, limite: 100 }),
          getSucursales(),
          getTarifas(),
        ]);

      const catalogErrors = [];

      const resolveItems = (result, label) => {
        if (result.status === "fulfilled") {
          return normalizeCollectionPayload(result.value).items;
        }
        catalogErrors.push(
          result.reason?.response?.data?.message ||
            result.reason?.message ||
            `No se pudo cargar ${label}.`
        );
        return [];
      };

      setCatalogs({
        clientes: resolveItems(clientesResult, "clientes"),
        sucursales: resolveItems(sucursalesResult, "sucursales"),
        tarifas: resolveItems(tarifasResult, "tarifas"),
      });

      if (catalogErrors.length > 0) {
        setError(catalogErrors.join(" "));
      }
    };

    loadCatalogs();
  }, []);

  const fechasReservaValidas = useMemo(() => {
    if (!form.fecha_inicio || !form.fecha_fin) {
      return false;
    }

    const fechaInicio = new Date(`${form.fecha_inicio}T00:00:00`);
    const fechaFin = new Date(`${form.fecha_fin}T00:00:00`);
    return fechaFin > fechaInicio;
  }, [form.fecha_inicio, form.fecha_fin]);

  const resetHabitacionEnLineas = (lineas) =>
    lineas.map((linea) => ({
      ...linea,
      habitacion_id: "",
      habitacion_guid: "",
      precio_noche_aplicado: "",
    }));

  useEffect(() => {
    if (!isValidGuid(form.sucursal_guid) || !fechasReservaValidas) {
      setHabitacionesDisponibles([]);
      setHabitacionesLoadError(null);
      setLoadingHabitaciones(false);
      return;
    }

    let cancelled = false;

    const loadDisponibles = async () => {
      setLoadingHabitaciones(true);
      setHabitacionesLoadError(null);

      try {
        const items = await getHabitacionesDisponiblesPorSucursal({
          sucursalGuid: form.sucursal_guid,
          fechaInicio: form.fecha_inicio,
          fechaFin: form.fecha_fin,
        });

        if (!cancelled) {
          setHabitacionesDisponibles(items);
        }
      } catch (err) {
        if (!cancelled) {
          setHabitacionesDisponibles([]);
          setHabitacionesLoadError(
            extractApiErrorMessage(
              err,
              "No se pudieron cargar las habitaciones disponibles."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHabitaciones(false);
        }
      }
    };

    loadDisponibles();

    return () => {
      cancelled = true;
    };
  }, [form.sucursal_guid, form.fecha_inicio, form.fecha_fin, fechasReservaValidas]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "cliente_guid") {
      setForm((prev) => ({
        ...prev,
        cliente_id: "",
        cliente_guid: value,
      }));
      return;
    }

    if (name === "sucursal_guid") {
      setForm((prev) => ({
        ...prev,
        sucursal_id: "",
        sucursal_guid: value,
        habitaciones: prev.habitaciones.map(() => createEmptyLinea()),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const minFechaInicio = useMemo(() => getLocalDateMin(), []);

  const minFechaFin = useMemo(
    () =>
      form.fecha_inicio
        ? addDaysToIsoDate(form.fecha_inicio, 1)
        : minFechaInicio,
    [form.fecha_inicio, minFechaInicio]
  );

  const getHabitacionesParaLinea = (lineIndex) => {
    const currentGuid = trimText(form.habitaciones[lineIndex]?.habitacion_guid);
    const seleccionadas = form.habitaciones
      .map((linea, index) =>
        index === lineIndex ? "" : trimText(linea.habitacion_guid)
      )
      .filter(isValidGuid);

    return habitacionesDisponibles.filter(
      (habitacion) =>
        habitacion.habitacionGuid === currentGuid ||
        !seleccionadas.includes(habitacion.habitacionGuid)
    );
  };

  useEffect(() => {
    if (loadingHabitaciones) {
      return;
    }

    const disponiblesGuids = new Set(
      habitacionesDisponibles.map((habitacion) => habitacion.habitacionGuid)
    );

    setForm((prev) => {
      let changed = false;
      const habitaciones = prev.habitaciones.map((linea) => {
        if (
          isValidGuid(linea.habitacion_guid) &&
          !disponiblesGuids.has(linea.habitacion_guid)
        ) {
          changed = true;
          return {
            ...linea,
            habitacion_id: "",
            habitacion_guid: "",
            precio_noche_aplicado: "",
          };
        }
        return linea;
      });

      return changed ? { ...prev, habitaciones } : prev;
    });
  }, [habitacionesDisponibles, loadingHabitaciones]);

  const tarifasPorSucursal = useMemo(() => {
    if (!isValidGuid(form.sucursal_guid)) {
      return [];
    }

    return catalogs.tarifas.filter(
      (tarifa) =>
        tarifa.sucursalGuid === form.sucursal_guid &&
        (tarifa.estadoTarifa ?? "ACT") === "ACT"
    );
  }, [catalogs.tarifas, form.sucursal_guid]);

  const handleFechaInicioChange = (nextValue) => {
    setForm((prev) => {
      if (!nextValue) {
        return {
          ...prev,
          fecha_inicio: "",
          fecha_fin: "",
          habitaciones: resetHabitacionEnLineas(prev.habitaciones),
        };
      }

      const resetFin = prev.fecha_fin && prev.fecha_fin <= nextValue;

      return {
        ...prev,
        fecha_inicio: nextValue,
        fecha_fin: resetFin ? "" : prev.fecha_fin,
        habitaciones: resetHabitacionEnLineas(prev.habitaciones),
      };
    });
  };

  const handleFechaFinChange = (nextValue) => {
    setForm((prev) => ({
      ...prev,
      fecha_fin: nextValue,
      habitaciones: resetHabitacionEnLineas(prev.habitaciones),
    }));
  };

  const handleLineaChange = (index, event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.map((item, currentIndex) =>
        currentIndex === index
          ? (() => {
              if (name === "habitacion_guid") {
                const habitacion = getHabitacionesParaLinea(index).find(
                  (current) => current.habitacionGuid === value
                );
                return {
                  ...item,
                  habitacion_guid: value,
                  habitacion_id: "",
                  precio_noche_aplicado:
                    item.precio_noche_aplicado ||
                    (habitacion?.precioBase != null
                      ? String(habitacion.precioBase)
                      : ""),
                };
              }

              if (name === "tarifa_guid") {
                const tarifa = tarifasPorSucursal.find(
                  (current) => current.tarifaGuid === value
                );
                return {
                  ...item,
                  tarifa_guid: value,
                  tarifa_id: "",
                  precio_noche_aplicado:
                    tarifa?.precioPorNoche != null
                      ? String(tarifa.precioPorNoche)
                      : item.precio_noche_aplicado,
                };
              }

              return { ...item, [name]: value };
            })()
          : item
      ),
    }));
  };

  const handleLineaBlur = (index, name) => {
    setTouched((prev) => ({ ...prev, [getLineFieldKey(index, name)]: true }));
  };

  const getFormError = (name) =>
    submitAttempted || touched[name] ? validation.formErrors[name] : "";

  const getLineError = (index, name) =>
    submitAttempted || touched[getLineFieldKey(index, name)]
      ? validation.lineErrors[index]?.[name]
      : "";

  const getFieldClassName = (errorText, baseClass = styles.field) =>
    [baseClass, errorText ? styles.fieldError : ""].filter(Boolean).join(" ");

  const addLinea = () => {
    setForm((prev) => ({
      ...prev,
      habitaciones: [...prev.habitaciones, createEmptyLinea()],
    }));
  };

  const removeLinea = (index) => {
    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);

    const hasValidationErrors =
      Object.values(validation.formErrors).some(Boolean) ||
      validation.lineErrors.some((item) => Object.values(item).some(Boolean));

    if (hasValidationErrors) {
      return;
    }

    setLoading(true);

    try {
      if (!isValidGuid(form.cliente_guid)) {
        throw new Error("Debes seleccionar un cliente válido.");
      }
      if (!isValidGuid(form.sucursal_guid)) {
        throw new Error("Debes seleccionar una sucursal válida.");
      }
      if (!form.fecha_inicio || !form.fecha_fin) {
        throw new Error("Debes ingresar fecha de inicio y fin.");
      }

      const now = new Date(`${getLocalDateMin()}T00:00:00`);
      const fechaInicio = new Date(`${form.fecha_inicio}T00:00:00`);
      const fechaFin = new Date(`${form.fecha_fin}T00:00:00`);

      if (fechaInicio < now || fechaFin < now) {
        throw new Error("No se puede reservar en fechas pasadas.");
      }
      if (fechaFin <= fechaInicio) {
        throw new Error("La fecha fin debe ser mayor que la fecha inicio.");
      }
      if (!["PORTAL", "ADMIN", "WALKIN"].includes(form.origen_canal_reserva)) {
        throw new Error("El canal de la reserva no es válido.");
      }
      if (form.observaciones && form.observaciones.length > 2000) {
        throw new Error("Las observaciones son demasiado largas.");
      }

      const habitaciones = form.habitaciones.map((item, index) => {
        const habitacionGuid = trimText(item.habitacion_guid);
        const tarifaGuid = trimText(item.tarifa_guid);
        const numAdultos = Number(item.num_adultos);
        const numNinos = Number(item.num_ninos);
        const precioNocheAplicado = Number(item.precio_noche_aplicado);

        if (!isValidGuid(habitacionGuid)) {
          throw new Error(`Selecciona la habitación de la línea ${index + 1}.`);
        }
        if (
          !habitacionesDisponibles.some(
            (habitacion) => habitacion.habitacionGuid === habitacionGuid
          )
        ) {
          throw new Error(
            `La habitación de la línea ${index + 1} ya no está disponible para las fechas elegidas.`
          );
        }
        if (!isValidGuid(tarifaGuid)) {
          throw new Error(`Selecciona la tarifa de la línea ${index + 1}.`);
        }
        if (numAdultos <= 0) {
          throw new Error(`La línea ${index + 1} debe tener al menos un adulto.`);
        }
        if (numNinos < 0) {
          throw new Error(`La línea ${index + 1} no admite niños negativos.`);
        }
        if (precioNocheAplicado <= 0 || Number.isNaN(precioNocheAplicado)) {
          throw new Error(`La línea ${index + 1} tiene un precio por noche inválido.`);
        }

        return {
          habitacionGuid,
          tarifaGuid,
          fechaInicio: form.fecha_inicio,
          fechaFin: form.fecha_fin,
          numAdultos,
          numNinos,
          precioNocheAplicado,
        };
      });

      if (habitaciones.length === 0) {
        throw new Error("Debes agregar al menos una habitación.");
      }

      const habitacionGuids = habitaciones.map((linea) => linea.habitacionGuid);
      const habitacionesDuplicadas = habitacionGuids.filter(
        (guid, index) => habitacionGuids.indexOf(guid) !== index
      );
      if (habitacionesDuplicadas.length > 0) {
        throw new Error(
          "No puedes asignar la misma habitación en más de una línea. Quita las líneas duplicadas."
        );
      }

      const payload = {
        clienteGuid: form.cliente_guid,
        sucursalGuid: form.sucursal_guid,
        fechaInicio: form.fecha_inicio,
        fechaFin: form.fecha_fin,
        origenCanalReserva: form.origen_canal_reserva,
        observaciones: form.observaciones.trim() || null,
        esWalkin: form.es_walkin,
        habitaciones,
      };

      await createReserva(payload);
      setSuccess("Reserva creada correctamente.");
      setTimeout(() => navigate("/admin/reservas"), 1500);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <div className={styles.topBar}>
        <h2>Nueva Reserva</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Datos de Reserva</h3>
        <div className={styles.grid2}>
          <div className={getFieldClassName(getFormError("cliente_guid"), styles.fieldWide)}>
            <label htmlFor="cliente_guid">Cliente</label>
            <select
              id="cliente_guid"
              name="cliente_guid"
              value={form.cliente_guid}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("cliente_guid"))}
              aria-describedby={getDescribedBy(
                "cliente_guid-help",
                "cliente_guid-error",
                getFormError("cliente_guid")
              )}
            >
              <option value="">Selecciona un cliente</option>
              {catalogs.clientes.map((item) => (
                <option key={item.clienteGuid} value={item.clienteGuid}>
                  {`${trimText(item.nombres)} ${trimText(item.apellidos)}`.trim()} (
                  {trimText(item.numeroIdentificacion)})
                </option>
              ))}
            </select>
            <FieldHint
              helpId="cliente_guid-help"
              errorId="cliente_guid-error"
              helpText="Cliente que quedará asociado a la reserva."
              errorText={getFormError("cliente_guid")}
            />
          </div>
          <div className={getFieldClassName(getFormError("sucursal_guid"), styles.fieldWide)}>
            <label htmlFor="sucursal_guid">Sucursal</label>
            <select
              id="sucursal_guid"
              name="sucursal_guid"
              value={form.sucursal_guid}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("sucursal_guid"))}
              aria-describedby={getDescribedBy(
                "sucursal_guid-help",
                "sucursal_guid-error",
                getFormError("sucursal_guid")
              )}
            >
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.sucursalGuid}>
                  {trimText(item.nombreSucursal)} ({trimText(item.codigoSucursal)})
                </option>
              ))}
            </select>
            <FieldHint
              helpId="sucursal_guid-help"
              errorId="sucursal_guid-error"
              helpText="Las habitaciones disponibles dependen de la sucursal y las fechas de la reserva."
              errorText={getFormError("sucursal_guid")}
            />
          </div>
          <div className={getFieldClassName(getFormError("fecha_inicio"), styles.fieldCompact)}>
            <label htmlFor="fecha_inicio">Fecha inicio</label>
            <MinimalDateInput
              id="fecha_inicio"
              variant="admin"
              value={form.fecha_inicio}
              onChange={handleFechaInicioChange}
              onBlur={() => setTouched((prev) => ({ ...prev, fecha_inicio: true }))}
              minDate={minFechaInicio}
              hasError={Boolean(getFormError("fecha_inicio"))}
              aria-describedby={getDescribedBy(
                "fecha_inicio-help",
                "fecha_inicio-error",
                getFormError("fecha_inicio")
              )}
            />
            <FieldHint
              helpId="fecha_inicio-help"
              errorId="fecha_inicio-error"
              helpText="Fecha de entrada de la reserva."
              errorText={getFormError("fecha_inicio")}
            />
          </div>
          <div className={getFieldClassName(getFormError("fecha_fin"), styles.fieldCompact)}>
            <label htmlFor="fecha_fin">Fecha fin</label>
            <MinimalDateInput
              id="fecha_fin"
              variant="admin"
              value={form.fecha_fin}
              onChange={handleFechaFinChange}
              onBlur={() => setTouched((prev) => ({ ...prev, fecha_fin: true }))}
              minDate={minFechaFin}
              hasError={Boolean(getFormError("fecha_fin"))}
              aria-describedby={getDescribedBy(
                "fecha_fin-help",
                "fecha_fin-error",
                getFormError("fecha_fin")
              )}
            />
            <FieldHint
              helpId="fecha_fin-help"
              errorId="fecha_fin-error"
              helpText="Debe ser posterior a la fecha de inicio."
              errorText={getFormError("fecha_fin")}
            />
          </div>
          <div
            className={getFieldClassName(
              getFormError("origen_canal_reserva"),
              styles.fieldCompact
            )}
          >
            <label htmlFor="origen_canal_reserva">Origen canal reserva</label>
            <select
              id="origen_canal_reserva"
              name="origen_canal_reserva"
              value={form.origen_canal_reserva}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("origen_canal_reserva"))}
              aria-describedby={getDescribedBy(
                "origen_canal_reserva-help",
                "origen_canal_reserva-error",
                getFormError("origen_canal_reserva")
              )}
            >
              <option value="PORTAL">PORTAL</option>
              <option value="ADMIN">ADMIN</option>
              <option value="WALKIN">WALKIN</option>
            </select>
            <FieldHint
              helpId="origen_canal_reserva-help"
              errorId="origen_canal_reserva-error"
              helpText="Opciones permitidas por la base de datos de reservas."
              errorText={getFormError("origen_canal_reserva")}
            />
          </div>
          <div className={getFieldClassName(getFormError("observaciones"), styles.fieldFull)}>
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("observaciones"))}
              aria-describedby={getDescribedBy(
                "observaciones-help",
                "observaciones-error",
                getFormError("observaciones")
              )}
            />
            <FieldHint
              helpId="observaciones-help"
              errorId="observaciones-error"
              helpText="Notas internas opcionales para recepción o seguimiento."
              errorText={getFormError("observaciones")}
              counterText={getCounterText(form.observaciones, 2000)}
            />
          </div>
          <div className={styles.fieldFull}>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" name="es_walkin" checked={form.es_walkin} onChange={handleChange} />
                <span>Es walk-in</span>
              </label>
            </div>
            <FieldHint
              helpId="es_walkin-help"
              errorId="es_walkin-error"
              helpText="Marca esta opción cuando la reserva se genera presencialmente."
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.topBar}>
          <h3 className={styles.sectionTitle}>Habitaciones de la reserva</h3>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={addLinea}
            disabled={!fechasReservaValidas || !isValidGuid(form.sucursal_guid)}
          >
            Agregar habitación
          </button>
        </div>

        {habitacionesLoadError && (
          <div className={styles.errorBox}>{habitacionesLoadError}</div>
        )}

        <div className={styles.lineList}>
          {form.habitaciones.map((item, index) => {
            const habitacionesLinea = getHabitacionesParaLinea(index);
            const habitacionSelectDisabled =
              !isValidGuid(form.sucursal_guid) ||
              !fechasReservaValidas ||
              loadingHabitaciones;

            return (
            <div key={`habitacion-linea-${index}`} className={styles.lineCard}>
              <div className={styles.lineHeader}>
                <strong>Línea {index + 1}</strong>
                {form.habitaciones.length > 1 && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => removeLinea(index)}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className={styles.lineGrid}>
                <div
                  className={getFieldClassName(
                    getLineError(index, "habitacion_guid"),
                    styles.fieldWide
                  )}
                >
                  <label htmlFor={`habitacion_guid_${index}`}>Habitación</label>
                  <select
                    id={`habitacion_guid_${index}`}
                    name="habitacion_guid"
                    value={item.habitacion_guid}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "habitacion_guid")}
                    disabled={habitacionSelectDisabled}
                    aria-invalid={Boolean(getLineError(index, "habitacion_guid"))}
                    aria-describedby={getDescribedBy(
                      `habitacion_guid_${index}-help`,
                      `habitacion_guid_${index}-error`,
                      getLineError(index, "habitacion_guid")
                    )}
                  >
                    <option value="">
                      {!isValidGuid(form.sucursal_guid)
                        ? "Primero selecciona una sucursal"
                        : !fechasReservaValidas
                          ? "Indica fecha inicio y fin válidas"
                          : loadingHabitaciones
                            ? "Cargando habitaciones disponibles..."
                            : habitacionesLinea.length === 0
                              ? "No hay habitaciones disponibles en esas fechas"
                              : "Selecciona una habitación"}
                    </option>
                    {habitacionesLinea.map((habitacion) => (
                      <option
                        key={habitacion.habitacionGuid}
                        value={habitacion.habitacionGuid}
                      >
                        Habitación {trimText(habitacion.numeroHabitacion)}
                        {habitacion.piso != null && habitacion.piso !== 0
                          ? ` · Piso ${habitacion.piso}`
                          : ""}
                        {habitacion.tipoNombre
                          ? ` · ${trimText(habitacion.tipoNombre)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <FieldHint
                    helpId={`habitacion_guid_${index}-help`}
                    errorId={`habitacion_guid_${index}-error`}
                    helpText={
                      !isValidGuid(form.sucursal_guid)
                        ? "Elige la sucursal antes de asignar habitaciones."
                        : !fechasReservaValidas
                          ? "Completa las fechas de la reserva para ver habitaciones libres."
                          : loadingHabitaciones
                            ? "Consultando disponibilidad en alojamiento..."
                            : `${habitacionesLinea.length} habitación(es) disponibles para el rango seleccionado.`
                    }
                    errorText={getLineError(index, "habitacion_guid")}
                  />
                </div>
                <div
                  className={getFieldClassName(
                    getLineError(index, "tarifa_guid"),
                    styles.fieldWide
                  )}
                >
                  <label htmlFor={`tarifa_guid_${index}`}>Tarifa</label>
                  <select
                    id={`tarifa_guid_${index}`}
                    name="tarifa_guid"
                    value={item.tarifa_guid}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "tarifa_guid")}
                    disabled={!isValidGuid(form.sucursal_guid)}
                    aria-invalid={Boolean(getLineError(index, "tarifa_guid"))}
                    aria-describedby={getDescribedBy(
                      `tarifa_guid_${index}-help`,
                      `tarifa_guid_${index}-error`,
                      getLineError(index, "tarifa_guid")
                    )}
                  >
                    <option value="">
                      {isValidGuid(form.sucursal_guid)
                        ? "Selecciona una tarifa"
                        : "Primero selecciona una sucursal"}
                    </option>
                    {tarifasPorSucursal.map((tarifa) => (
                      <option key={tarifa.tarifaGuid} value={tarifa.tarifaGuid}>
                        {trimText(tarifa.codigoTarifa)} · {trimText(tarifa.nombreTarifa)}
                      </option>
                    ))}
                  </select>
                  <FieldHint
                    helpId={`tarifa_guid_${index}-help`}
                    errorId={`tarifa_guid_${index}-error`}
                    helpText={
                      isValidGuid(form.sucursal_guid)
                        ? `${tarifasPorSucursal.length} tarifa(s) activas para la sucursal.`
                        : "Elige la sucursal antes de asignar tarifas."
                    }
                    errorText={getLineError(index, "tarifa_guid")}
                  />
                </div>
                <div
                  className={getFieldClassName(getLineError(index, "num_adultos"), styles.fieldCompact)}
                >
                  <label htmlFor={`num_adultos_${index}`}>Adultos</label>
                  <input
                    id={`num_adultos_${index}`}
                    type="number"
                    min="1"
                    name="num_adultos"
                    value={item.num_adultos}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "num_adultos")}
                    required
                    aria-invalid={Boolean(getLineError(index, "num_adultos"))}
                    aria-describedby={getDescribedBy(
                      `num_adultos_${index}-help`,
                      `num_adultos_${index}-error`,
                      getLineError(index, "num_adultos")
                    )}
                  />
                  <FieldHint
                    helpId={`num_adultos_${index}-help`}
                    errorId={`num_adultos_${index}-error`}
                    helpText="Debe ser mayor a cero."
                    errorText={getLineError(index, "num_adultos")}
                  />
                </div>
                <div
                  className={getFieldClassName(getLineError(index, "num_ninos"), styles.fieldCompact)}
                >
                  <label htmlFor={`num_ninos_${index}`}>Niños</label>
                  <input
                    id={`num_ninos_${index}`}
                    type="number"
                    min="0"
                    name="num_ninos"
                    value={item.num_ninos}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "num_ninos")}
                    required
                    aria-invalid={Boolean(getLineError(index, "num_ninos"))}
                    aria-describedby={getDescribedBy(
                      `num_ninos_${index}-help`,
                      `num_ninos_${index}-error`,
                      getLineError(index, "num_ninos")
                    )}
                  />
                  <FieldHint
                    helpId={`num_ninos_${index}-help`}
                    errorId={`num_ninos_${index}-error`}
                    helpText="Puede ser cero o más."
                    errorText={getLineError(index, "num_ninos")}
                  />
                </div>
                <div
                  className={getFieldClassName(
                    getLineError(index, "precio_noche_aplicado"),
                    styles.fieldCompact
                  )}
                >
                  <label htmlFor={`precio_noche_aplicado_${index}`}>Precio noche aplicado</label>
                  <input
                    id={`precio_noche_aplicado_${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    name="precio_noche_aplicado"
                    value={item.precio_noche_aplicado}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "precio_noche_aplicado")}
                    required
                    aria-invalid={Boolean(getLineError(index, "precio_noche_aplicado"))}
                    aria-describedby={getDescribedBy(
                      `precio_noche_aplicado_${index}-help`,
                      `precio_noche_aplicado_${index}-error`,
                      getLineError(index, "precio_noche_aplicado")
                    )}
                  />
                  <FieldHint
                    helpId={`precio_noche_aplicado_${index}-help`}
                    errorId={`precio_noche_aplicado_${index}-error`}
                    helpText="Debe ser mayor a cero."
                    errorText={getLineError(index, "precio_noche_aplicado")}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}
