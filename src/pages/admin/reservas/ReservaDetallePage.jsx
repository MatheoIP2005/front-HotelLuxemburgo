import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientes } from "../../../services/clientes.service";
import {
  generarFacturaFinal,
  generarFacturaFinalYPagoSimulado,
  generarFacturaReserva,
  getFacturaPagos,
  getFacturasByReserva,
} from "../../../services/facturas.service";
import { getReserva } from "../../../services/reservas.service";
import {
  getCargosEstadia,
  getEstadias,
  hacerCheckin,
} from "../../../services/estadias.service";
import { getSucursales } from "../../../services/sucursales.service";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "./ReservasPage.module.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
};

const getReservaGuid = (reserva, fallback) =>
  reserva?.reservaGuid ?? reserva?.guidReserva ?? fallback;

const getDiffDays = (start, end) => {
  if (!start || !end) return 1;
  const startDate = new Date(`${String(start).slice(0, 10)}T00:00:00`);
  const endDate = new Date(`${String(end).slice(0, 10)}T00:00:00`);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return Math.max(1, diffDays);
};

const buildReservaFacturaItems = (reserva) => {
  const habitaciones = Array.isArray(reserva?.habitaciones) ? reserva.habitaciones : [];
  if (habitaciones.length === 0) {
    return [];
  }

  return habitaciones.map((item, index) => {
    const nights = getDiffDays(
      item.fechaInicio ?? reserva?.fechaInicio,
      item.fechaFin ?? reserva?.fechaFin
    );
    const precioUnitario = Number(item.precioNocheAplicado ?? 0);
    const subtotal = Number(item.subtotalLinea ?? precioUnitario * nights);
    const valorIva = Number(item.valorIvaLinea ?? 0);
    const descuento = Number(item.descuentoLinea ?? 0);
    const total = Number(item.totalLinea ?? subtotal + valorIva - descuento);
    const numeroHabitacion =
      item.numeroHabitacion ?? item.habitacionNumero ?? item.idHabitacion ?? index + 1;

    return {
      descripcion: `Habitación ${numeroHabitacion} (${String(
        item.fechaInicio ?? reserva?.fechaInicio ?? ""
      ).slice(0, 10)} - ${String(item.fechaFin ?? reserva?.fechaFin ?? "").slice(0, 10)})`,
      cantidad: nights,
      precioUnitario,
      subtotal,
      valorIva,
      descuento,
      total,
      tipoItem: "ALOJAMIENTO",
      referenciaTipo: "RESERVA_HABITACION",
      referenciaGuid: item.reservaHabitacionGuid ?? null,
    };
  });
};

const buildFinalFacturaItems = (cargos = []) =>
  cargos
    .filter((cargo) => cargo.estadoCargo === "PEN")
    .map((cargo) => ({
      descripcion: cargo.descripcionCargo ?? "Cargo de estadía",
      cantidad: Number(cargo.cantidad ?? 1),
      precioUnitario: Number(cargo.precioUnitario ?? 0),
      subtotal: Number(cargo.subtotal ?? cargo.totalCargo ?? 0),
      valorIva: Number(cargo.valorIva ?? 0),
      descuento: 0,
      total: Number(cargo.totalCargo ?? 0),
      tipoItem: "SERVICIO",
      referenciaTipo: "CARGO_ESTADIA",
      referenciaGuid: cargo.cargoGuid ?? null,
    }));

export default function ReservaDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [catalogs, setCatalogs] = useState({ clientes: [], sucursales: [] });
  const [estadiasReserva, setEstadiasReserva] = useState([]);
  const [cargosReserva, setCargosReserva] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [facturaPagos, setFacturaPagos] = useState([]);
  const [selectedFacturaGuid, setSelectedFacturaGuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [financeResult, setFinanceResult] = useState(null);
  const [checkinResult, setCheckinResult] = useState(null);

  const selectedFactura = useMemo(
    () =>
      facturas.find(
        (item) =>
          String(item.facturaGuid ?? item.guidFactura) === String(selectedFacturaGuid)
      ) ?? null,
    [facturas, selectedFacturaGuid]
  );

  const activeReservaFactura = useMemo(
    () => facturas.find((item) => item.tipoFactura === "RESERVA" && item.estado !== "ANU") ?? null,
    [facturas]
  );

  const activeFinalFactura = useMemo(
    () => facturas.find((item) => item.tipoFactura === "FINAL" && item.estado !== "ANU") ?? null,
    [facturas]
  );

  const pendingCargos = useMemo(
    () => cargosReserva.filter((cargo) => cargo.estadoCargo === "PEN"),
    [cargosReserva]
  );

  const loadFacturaPagos = useCallback(async (facturaGuid) => {
    if (!facturaGuid) {
      setFacturaPagos([]);
      setSelectedFacturaGuid("");
      return;
    }

    const pagos = await getFacturaPagos(facturaGuid);
    setSelectedFacturaGuid(facturaGuid);
    setFacturaPagos(Array.isArray(pagos) ? pagos : []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reservaGuid = id;
      const [
        reservaResponse,
        clientesResponse,
        sucursalesResponse,
        facturasResponse,
        estadiasResponse,
      ] =
        await Promise.all([
          getReserva(reservaGuid),
          getClientes({ pagina: 1, limite: 500 }),
          getSucursales({ pagina: 1, limite: 500 }),
          getFacturasByReserva(reservaGuid).catch(() => []),
          getEstadias({ pagina: 1, limite: 200, reservaGuid }).catch(() => []),
        ]);

      const estadias = normalizeCollectionPayload(estadiasResponse, {
        pagina: 1,
        limite: 200,
      }).items.filter(
        (item) =>
          String(item.reservaGuid ?? "") === String(reservaGuid) ||
          String(item.idReserva ?? "") === String(reservaResponse?.idReserva ?? "")
      );

      const cargosPorEstadia = await Promise.all(
        estadias.map(async (estadia) => {
          const cargos = await getCargosEstadia(estadia.estadiaGuid).catch(() => []);
          return Array.isArray(cargos)
            ? cargos.map((cargo) => ({ ...cargo, estadiaGuid: estadia.estadiaGuid }))
            : [];
        })
      );

      setReserva(reservaResponse ?? null);
      setCatalogs({
        clientes: normalizeCollectionPayload(clientesResponse, {
          pagina: 1,
          limite: 500,
        }).items,
        sucursales: normalizeCollectionPayload(sucursalesResponse, {
          pagina: 1,
          limite: 500,
        }).items,
      });
      setEstadiasReserva(estadias);
      setCargosReserva(cargosPorEstadia.flat());
      setFacturas(Array.isArray(facturasResponse) ? facturasResponse : []);
    } catch (err) {
      const apiError = err?.response?.data;
      const details = Array.isArray(apiError?.details)
        ? ` ${apiError.details.join(" | ")}`
        : "";
      setError(
        apiError?.error
          ? `${apiError.error}.${details}`
          : apiError?.message || "No se pudo cargar la reserva."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  const buildFacturaBody = (mode) => {
    const clienteGuid =
      reserva?.clienteGuid ??
      catalogs.clientes.find(
        (item) => String(item.idCliente) === String(reserva?.idCliente)
      )?.clienteGuid;
    const sucursalGuid =
      reserva?.sucursalGuid ??
      catalogs.sucursales.find(
        (item) => String(item.idSucursal) === String(reserva?.idSucursal)
      )?.sucursalGuid;

    if (!clienteGuid) {
      throw new Error("No se pudo resolver `clienteGuid` para generar la factura.");
    }
    if (!sucursalGuid) {
      throw new Error("No se pudo resolver `sucursalGuid` para generar la factura.");
    }

    const items =
      mode === "reserva"
        ? buildReservaFacturaItems(reserva)
        : buildFinalFacturaItems(cargosReserva);
    if (items.length === 0) {
      throw new Error(
        mode === "reserva"
          ? "La reserva no tiene líneas de alojamiento suficientes para generar la factura."
          : "No existen cargos de estadía pendientes para generar la factura final."
      );
    }

    return {
      clienteGuid,
      sucursalGuid,
      items,
    };
  };

  const goToPagoForm = (facturaGuid) => {
    if (!facturaGuid) return;
    navigate("/admin/pagos/nuevo", {
      state: { facturaGuid },
    });
  };

  const handleFacturaAction = async (mode) => {
    if (!reserva) return;
    setActionLoading(true);
    setActionError(null);
    setSuccess(null);
    setFinanceResult(null);

    try {
      const reservaGuid = getReservaGuid(reserva, id);
      const estadoReserva = String(reserva.estadoReserva ?? "").trim().toUpperCase();

      if (mode === "reserva") {
        if (!["CON", "EMI", "FIN"].includes(estadoReserva)) {
          throw new Error("La factura de reserva solo puede emitirse para reservas confirmadas, en estadía o finalizadas.");
        }
        if (activeReservaFactura) {
          throw new Error("Ya existe una factura de reserva activa para esta reserva.");
        }
      } else {
        if (!["EMI", "FIN"].includes(estadoReserva)) {
          throw new Error("La factura final solo puede emitirse para reservas en estadía o finalizadas.");
        }
        if (activeFinalFactura) {
          throw new Error("Ya existe una factura final activa para esta reserva.");
        }
        if (pendingCargos.length === 0) {
          throw new Error("No hay cargos pendientes de facturar para esta reserva.");
        }
      }

      const body = buildFacturaBody(mode);
      let result;

      if (mode === "reserva") {
        result = await generarFacturaReserva(reservaGuid, body);
        setSuccess("Factura de reserva generada correctamente.");
      } else if (mode === "final") {
        result = await generarFacturaFinal(reservaGuid, body);
        setSuccess("Factura final generada correctamente.");
      } else {
        result = await generarFacturaFinalYPagoSimulado(reservaGuid, body, "EFECTIVO");
        setSuccess("Factura final generada, pago registrado y aprobado correctamente.");
      }

      setFinanceResult(result);
      await loadData();

      const generatedFacturaGuid =
        result?.factura?.facturaGuid ?? result?.facturaGuid ?? null;
      const generatedSaldoPendiente = Number(
        result?.factura?.saldoPendiente ?? result?.saldoPendiente ?? 0
      );
      if (generatedFacturaGuid) {
        await loadFacturaPagos(generatedFacturaGuid);
      }

      if (
        generatedFacturaGuid &&
        generatedSaldoPendiente > 0 &&
        !result?.pago &&
        window.confirm(
          `La factura quedó con saldo pendiente de ${formatCurrency(
            generatedSaldoPendiente
          )}. ¿Deseas registrar un pago ahora?`
        )
      ) {
        goToPagoForm(generatedFacturaGuid);
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "No se pudo generar la factura.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!reserva) return;
    if (!window.confirm("¿Deseas realizar el check-in de esta reserva?")) return;

    const observacionesCheckin =
      window.prompt("Observaciones de check-in (opcional):") || "";

    setActionLoading(true);
    setActionError(null);
    setSuccess(null);
    try {
      const result = await hacerCheckin(getReservaGuid(reserva, id), {
        observacionesCheckin: observacionesCheckin.trim() || null,
      });
      setCheckinResult(result);
      setSuccess("Check-in realizado correctamente.");
      await loadData();
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "No se pudo realizar el check-in.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Detalle de Reserva</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin/reservas")}>
          Volver
        </button>
      </div>

      {loading && <div className={styles.loadingMsg}>Cargando...</div>}
      {error && <div className={styles.errorBox}>{error}</div>}
      {(actionError || success) && !error && (
        <div className={actionError ? styles.errorBox : styles.successBox}>
          {actionError || success}
        </div>
      )}

      {!loading && !error && reserva && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <tbody>
                <tr><th>Código</th><td>{reserva.codigoReserva}</td></tr>
                <tr><th>GUID</th><td>{getReservaGuid(reserva, id)}</td></tr>
                <tr><th>Cliente</th><td>{reserva.clienteGuid ?? reserva.idCliente}</td></tr>
                <tr><th>Sucursal</th><td>{reserva.sucursalGuid ?? reserva.idSucursal}</td></tr>
                <tr><th>Inicio</th><td>{formatDate(reserva.fechaInicio)}</td></tr>
                <tr><th>Fin</th><td>{formatDate(reserva.fechaFin)}</td></tr>
                <tr><th>Subtotal</th><td>{formatCurrency(reserva.subtotalReserva)}</td></tr>
                <tr><th>IVA</th><td>{formatCurrency(reserva.valorIva)}</td></tr>
                <tr><th>Total</th><td>{formatCurrency(reserva.totalReserva)}</td></tr>
                <tr><th>Descuento</th><td>{formatCurrency(reserva.descuentoAplicado)}</td></tr>
                <tr><th>Saldo pendiente</th><td>{formatCurrency(reserva.saldoPendiente)}</td></tr>
                <tr><th>Estado</th><td>{reserva.estadoReserva}</td></tr>
                <tr><th>Canal</th><td>{reserva.origenCanalReserva}</td></tr>
                <tr><th>Estadías vinculadas</th><td>{estadiasReserva.length}</td></tr>
                <tr><th>Cargos pendientes</th><td>{pendingCargos.length}</td></tr>
              </tbody>
            </table>
          </div>

          <section className={styles.section}>
            <div className={styles.topBar}>
              <h3>Acciones financieras</h3>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => handleFacturaAction("reserva")}
                  disabled={actionLoading || Boolean(activeReservaFactura)}
                >
                  Generar factura reserva
                </button>
                <button
                  type="button"
                  className={styles.btnWarning}
                  onClick={() => handleFacturaAction("final")}
                  disabled={actionLoading || Boolean(activeFinalFactura) || pendingCargos.length === 0}
                >
                  Generar factura final
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => handleFacturaAction("simulada")}
                  disabled={actionLoading || Boolean(activeFinalFactura) || pendingCargos.length === 0}
                >
                  Final + pago simulado
                </button>
                {reserva.estadoReserva === "CON" && (
                  <button
                    type="button"
                    className={styles.btnWarning}
                    onClick={handleCheckin}
                    disabled={actionLoading}
                  >
                    Hacer check-in
                  </button>
                )}
              </div>
            </div>
            <div className={styles.resultCard}>
              <div>
                <strong>Factura RESERVA activa:</strong>{" "}
                {activeReservaFactura?.numeroFactura ?? "No"}
              </div>
              <div>
                <strong>Factura FINAL activa:</strong>{" "}
                {activeFinalFactura?.numeroFactura ?? "No"}
              </div>
              <div>
                <strong>Cargos pendientes para facturar:</strong> {pendingCargos.length}
              </div>
            </div>
          </section>

          {checkinResult && (
            <section className={styles.section}>
              <h3>Resultado de check-in</h3>
              <div className={styles.resultCard}>
                <div><strong>Estadía GUID:</strong> {checkinResult.estadiaGuid ?? "N/A"}</div>
                <div><strong>Estado:</strong> {checkinResult.estadoEstadia ?? "N/A"}</div>
                <div><strong>Check-in:</strong> {formatDate(checkinResult.checkinUtc)}</div>
              </div>
            </section>
          )}

          {financeResult && (
            <section className={styles.section}>
              <h3>Resultado de generación</h3>
              <div className={styles.resultCard}>
                <div>
                  <strong>Factura:</strong>{" "}
                  {financeResult?.factura?.numeroFactura ??
                    financeResult?.numeroFactura ??
                    "Generada"}
                </div>
                <div>
                  <strong>Factura GUID:</strong>{" "}
                  {financeResult?.factura?.facturaGuid ??
                    financeResult?.facturaGuid ??
                    "N/A"}
                </div>
                <div>
                  <strong>Estado factura:</strong>{" "}
                  {financeResult?.factura?.estado ?? financeResult?.estado ?? "N/A"}
                </div>
                <div>
                  <strong>Saldo pendiente:</strong>{" "}
                  {formatCurrency(
                    financeResult?.factura?.saldoPendiente ??
                      financeResult?.saldoPendiente
                  )}
                </div>
                {financeResult?.pago && (
                  <>
                    <div><strong>Pago GUID:</strong> {financeResult.pago.pagoGuid}</div>
                    <div><strong>Monto pagado:</strong> {formatCurrency(financeResult.pago.monto)}</div>
                    <div><strong>Estado pago:</strong> {financeResult.pago.estadoPago}</div>
                  </>
                )}
              </div>
              {Number(
                financeResult?.factura?.saldoPendiente ?? financeResult?.saldoPendiente ?? 0
              ) > 0 &&
                !financeResult?.pago && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() =>
                        goToPagoForm(
                          financeResult?.factura?.facturaGuid ??
                            financeResult?.facturaGuid
                        )
                      }
                    >
                      Ir a registrar pago
                    </button>
                  </div>
                )}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.topBar}>
              <h3>Facturas asociadas</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Tipo</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.emptyMsg}>
                        No hay facturas asociadas a esta reserva.
                      </td>
                    </tr>
                  )}
                  {facturas.map((factura) => {
                    const facturaGuid = factura.facturaGuid ?? factura.guidFactura;
                    return (
                      <tr key={facturaGuid}>
                        <td>{factura.numeroFactura}</td>
                        <td>{factura.tipoFactura}</td>
                        <td>{formatCurrency(factura.total)}</td>
                        <td>{formatCurrency(factura.saldoPendiente)}</td>
                        <td>{factura.estado}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => loadFacturaPagos(facturaGuid)}
                            >
                              Ver pagos
                            </button>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={() => goToPagoForm(facturaGuid)}
                              disabled={
                                Number(factura.saldoPendiente ?? 0) <= 0 || factura.estado !== "EMI"
                              }
                            >
                              {Number(factura.saldoPendiente ?? 0) > 0
                                ? "Pagar saldo"
                                : "Registrar pago"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {selectedFactura && (
            <section className={styles.section}>
              <h3>Pagos de factura {selectedFactura.numeroFactura}</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pago GUID</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaPagos.length === 0 && (
                      <tr>
                        <td colSpan={5} className={styles.emptyMsg}>
                          No hay pagos registrados para esta factura.
                        </td>
                      </tr>
                    )}
                    {facturaPagos.map((pago) => (
                      <tr key={pago.pagoGuid}>
                        <td>{pago.pagoGuid}</td>
                        <td>{formatCurrency(pago.monto)}</td>
                        <td>{pago.metodoPago}</td>
                        <td>{pago.estadoPago}</td>
                        <td>{formatDate(pago.fechaPagoUtc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
