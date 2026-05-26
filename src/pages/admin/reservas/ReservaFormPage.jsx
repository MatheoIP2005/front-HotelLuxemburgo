import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReserva } from "../../../services/reservas.service";
import { getClientes } from "../../../services/clientes.service";
import { getSucursales } from "../../../services/sucursales.service";
import { getHabitaciones } from "../../../services/habitaciones.service";
import { getTarifas } from "../../../services/tarifas.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "../usuarios/UsuarioFormPage.module.css";

const getLocalDateMin = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
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
    habitaciones: [],
    tarifas: [],
  });
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

      if (!item.habitacion_id || Number(item.habitacion_id) <= 0) {
        currentErrors.habitacion_id = "Seleccione una habitación válida.";
      }
      if (!item.tarifa_id || Number(item.tarifa_id) <= 0) {
        currentErrors.tarifa_id = "Seleccione una tarifa válida.";
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

    if (!form.cliente_id || Number(form.cliente_id) <= 0) {
      formErrors.cliente_id = "Seleccione un cliente válido.";
    }
    if (!form.sucursal_id || Number(form.sucursal_id) <= 0) {
      formErrors.sucursal_id = "Seleccione una sucursal válida.";
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
    if (Array.isArray(apiError?.details) && apiError.details.length > 0) {
      return `${apiError.error || "Solicitud inválida"}: ${apiError.details.join(" | ")}`;
    }
    return apiError?.message || apiError?.error || err?.message || "Error al guardar";
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [clientes, sucursales, habitaciones, tarifas] = await Promise.all([
          getClientes({ pagina: 1, limite: 100 }),
          getSucursales({ pagina: 1, limite: 100 }),
          getHabitaciones({ pagina: 1, limite: 100 }),
          getTarifas({ pagina: 1, limite: 100 }),
        ]);

        setCatalogs({
          clientes: normalizeCollectionPayload(clientes).items,
          sucursales: normalizeCollectionPayload(sucursales).items,
          habitaciones: normalizeCollectionPayload(habitaciones).items,
          tarifas: normalizeCollectionPayload(tarifas).items,
        });
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudieron cargar los catálogos.");
      }
    };

    loadCatalogs();
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "cliente_id") {
      const cliente = catalogs.clientes.find(
        (item) => String(item.idCliente) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        cliente_id: value,
        cliente_guid: cliente?.clienteGuid ?? "",
      }));
      return;
    }

    if (name === "sucursal_id") {
      const sucursal = catalogs.sucursales.find(
        (item) => String(item.idSucursal) === String(value)
      );
      setForm((prev) => ({
        ...prev,
        sucursal_id: value,
        sucursal_guid: sucursal?.sucursalGuid ?? "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleLineaChange = (index, event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.map((item, currentIndex) =>
        currentIndex === index
          ? (() => {
              if (name === "habitacion_id") {
                const habitacion = catalogs.habitaciones.find(
                  (current) => String(current.idHabitacion) === String(value)
                );
                return {
                  ...item,
                  habitacion_id: value,
                  habitacion_guid: habitacion?.habitacionGuid ?? "",
                };
              }

              if (name === "tarifa_id") {
                const tarifa = catalogs.tarifas.find(
                  (current) => String(current.idTarifa) === String(value)
                );
                return {
                  ...item,
                  tarifa_id: value,
                  tarifa_guid: tarifa?.tarifaGuid ?? "",
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
      if (!form.cliente_id || Number(form.cliente_id) <= 0) {
        throw new Error("Debes seleccionar un cliente válido.");
      }
      if (!form.sucursal_id || Number(form.sucursal_id) <= 0) {
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
        const idHabitacion = Number(item.habitacion_id);
        const idTarifa = Number(item.tarifa_id);
        const numAdultos = Number(item.num_adultos);
        const numNinos = Number(item.num_ninos);
        const precioNocheAplicado = Number(item.precio_noche_aplicado);

        if (!idHabitacion || idHabitacion <= 0) {
          throw new Error(`Selecciona la habitación de la línea ${index + 1}.`);
        }
        if (!idTarifa || idTarifa <= 0) {
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
          idHabitacion,
          idTarifa,
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

      const payload = {
        idCliente: Number(form.cliente_id),
        idSucursal: Number(form.sucursal_id),
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
          <div className={getFieldClassName(getFormError("cliente_id"), styles.fieldWide)}>
            <label htmlFor="cliente_id">Cliente</label>
            <select
              id="cliente_id"
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("cliente_id"))}
              aria-describedby={getDescribedBy(
                "cliente_id-help",
                "cliente_id-error",
                getFormError("cliente_id")
              )}
            >
              <option value="">Selecciona un cliente</option>
              {catalogs.clientes.map((item) => (
                <option key={item.clienteGuid} value={item.idCliente}>
                  {`${trimText(item.nombres)} ${trimText(item.apellidos)}`.trim()} ({trimText(item.numeroIdentificacion)}) - ID {item.idCliente}
                </option>
              ))}
            </select>
            <FieldHint
              helpId="cliente_id-help"
              errorId="cliente_id-error"
              helpText={`GUID: ${form.cliente_guid || "N/A"}`}
              errorText={getFormError("cliente_id")}
            />
          </div>
          <div className={getFieldClassName(getFormError("sucursal_id"), styles.fieldWide)}>
            <label htmlFor="sucursal_id">Sucursal</label>
            <select
              id="sucursal_id"
              name="sucursal_id"
              value={form.sucursal_id}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(getFormError("sucursal_id"))}
              aria-describedby={getDescribedBy(
                "sucursal_id-help",
                "sucursal_id-error",
                getFormError("sucursal_id")
              )}
            >
              <option value="">Selecciona una sucursal</option>
              {catalogs.sucursales.map((item) => (
                <option key={item.sucursalGuid} value={item.idSucursal}>
                  {trimText(item.nombreSucursal)} ({trimText(item.codigoSucursal)}) - ID {item.idSucursal}
                </option>
              ))}
            </select>
            <FieldHint
              helpId="sucursal_id-help"
              errorId="sucursal_id-error"
              helpText={`GUID: ${form.sucursal_guid || "N/A"}`}
              errorText={getFormError("sucursal_id")}
            />
          </div>
          <div className={getFieldClassName(getFormError("fecha_inicio"), styles.fieldCompact)}>
            <label htmlFor="fecha_inicio">Fecha inicio</label>
            <input
              id="fecha_inicio"
              type="date"
              min={getLocalDateMin()}
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFormError("fecha_inicio"))}
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
            <input
              id="fecha_fin"
              type="date"
              min={form.fecha_inicio || getLocalDateMin()}
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(getFormError("fecha_fin"))}
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
          <button type="button" className={styles.btnSecondary} onClick={addLinea}>
            Agregar habitación
          </button>
        </div>

        <div className={styles.lineList}>
          {form.habitaciones.map((item, index) => (
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
                  className={getFieldClassName(getLineError(index, "habitacion_id"), styles.fieldWide)}
                >
                  <label htmlFor={`habitacion_id_${index}`}>Habitación</label>
                  <select
                    id={`habitacion_id_${index}`}
                    name="habitacion_id"
                    value={item.habitacion_id}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "habitacion_id")}
                    aria-invalid={Boolean(getLineError(index, "habitacion_id"))}
                    aria-describedby={getDescribedBy(
                      `habitacion_id_${index}-help`,
                      `habitacion_id_${index}-error`,
                      getLineError(index, "habitacion_id")
                    )}
                  >
                    <option value="">Selecciona una habitación</option>
                    {catalogs.habitaciones.map((habitacion) => (
                      <option
                        key={habitacion.habitacionGuid}
                        value={habitacion.idHabitacion}
                      >
                        {trimText(habitacion.numeroHabitacion)} - ID {habitacion.idHabitacion}
                      </option>
                    ))}
                  </select>
                  <FieldHint
                    helpId={`habitacion_id_${index}-help`}
                    errorId={`habitacion_id_${index}-error`}
                    helpText={`GUID: ${item.habitacion_guid || "N/A"}`}
                    errorText={getLineError(index, "habitacion_id")}
                  />
                </div>
                <div
                  className={getFieldClassName(getLineError(index, "tarifa_id"), styles.fieldWide)}
                >
                  <label htmlFor={`tarifa_id_${index}`}>Tarifa</label>
                  <select
                    id={`tarifa_id_${index}`}
                    name="tarifa_id"
                    value={item.tarifa_id}
                    onChange={(event) => handleLineaChange(index, event)}
                    onBlur={() => handleLineaBlur(index, "tarifa_id")}
                    aria-invalid={Boolean(getLineError(index, "tarifa_id"))}
                    aria-describedby={getDescribedBy(
                      `tarifa_id_${index}-help`,
                      `tarifa_id_${index}-error`,
                      getLineError(index, "tarifa_id")
                    )}
                  >
                    <option value="">Selecciona una tarifa</option>
                    {catalogs.tarifas.map((tarifa) => (
                      <option key={tarifa.tarifaGuid} value={tarifa.idTarifa}>
                        {trimText(tarifa.codigoTarifa)} - {trimText(tarifa.nombreTarifa)} - ID {tarifa.idTarifa}
                      </option>
                    ))}
                  </select>
                  <FieldHint
                    helpId={`tarifa_id_${index}-help`}
                    errorId={`tarifa_id_${index}-error`}
                    helpText={`GUID: ${item.tarifa_guid || "N/A"}`}
                    errorText={getLineError(index, "tarifa_id")}
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
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </div>
    </form>
  );
}
