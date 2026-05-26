import { useEffect, useState } from "react";
import useEstadias from "../../../hooks/useEstadias";
import { getCatalogo } from "../../../services/catalogoServicios.service";
import {
  anularCargoEstadia,
  getCargoEstadia,
} from "../../../services/cargosEstadia.service";
import { CARGO_ESTADIA_ESTADOS, MAX_LENGTHS } from "../../../utils/constraints";
import { normalizeCollectionPayload } from "../../../utils/api";
import styles from "./EstadiasPage.module.css";

const EMPTY_CARGO_FORM = {
  catalogo_guid: "",
  descripcion_cargo: "",
  cantidad: "1",
  precio_unitario: "",
  fecha_consumo: "",
};

export default function EstadiasPage() {
  const {
    estadias,
    cargos,
    cargosLoading,
    selectedEstadiaGuid,
    loading,
    error,
    fetchCargos,
    handleAddCargo,
    handleCheckout,
  } = useEstadias();
  const [actionError, setActionError] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [cargoForm, setCargoForm] = useState(EMPTY_CARGO_FORM);
  const [success, setSuccess] = useState(null);
  const [cargoDetalle, setCargoDetalle] = useState(null);
  const selectedEstadia =
    estadias.find((item) => String(item.estadiaGuid) === String(selectedEstadiaGuid)) ?? null;

  useEffect(() => {
    const loadCatalogo = async () => {
      try {
        const response = await getCatalogo({ pagina: 1, limite: 200 });
        setCatalogo(normalizeCollectionPayload(response, { pagina: 1, limite: 200 }).items);
      } catch (err) {
        setActionError(err?.response?.data?.message || "No se pudo cargar el catálogo de cargos.");
      }
    };

    loadCatalogo();
  }, []);

  const onCheckout = async (id) => {
    if (!window.confirm("¿Deseas hacer checkout de esta estadía?")) return;

    setActionError(null);
    setSuccess(null);
    try {
      await handleCheckout(id, {});
      setSuccess("Checkout realizado correctamente.");
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo realizar checkout.");
    }
  };

  const onSelectCargoCatalogo = (value) => {
    const item =
      catalogo.find((current) => String(current.catalogoGuid) === String(value)) ?? null;
    setCargoForm((prev) => ({
      ...prev,
      catalogo_guid: value,
      descripcion_cargo: prev.descripcion_cargo || item?.nombreCatalogo || "",
      precio_unitario:
        prev.precio_unitario !== ""
          ? prev.precio_unitario
          : item?.precioBase !== undefined && item?.precioBase !== null
            ? String(item.precioBase)
            : "",
    }));
  };

  const onChangeCargo = (event) => {
    const { name, value } = event.target;
    if (name === "catalogo_guid") {
      onSelectCargoCatalogo(value);
      return;
    }
    setCargoForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVerCargos = async (estadiaGuid) => {
    setActionError(null);
    setSuccess(null);
    try {
      await fetchCargos(estadiaGuid);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudieron cargar los cargos.");
    }
  };

  const onRegistrarCargo = async (event) => {
    event.preventDefault();
    if (!selectedEstadiaGuid) return;

    setActionError(null);
    setSuccess(null);
    try {
      if (!cargoForm.catalogo_guid) {
        throw new Error("Debes seleccionar un ítem del catálogo.");
      }
      if (!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT") {
        throw new Error("Solo se pueden registrar cargos sobre estadías activas.");
      }
      if (!cargoForm.descripcion_cargo.trim()) {
        throw new Error("La descripción del cargo es obligatoria.");
      }
      if (cargoForm.descripcion_cargo.trim().length > MAX_LENGTHS.cargoEstadia.descripcion) {
        throw new Error("La descripción del cargo no puede exceder 250 caracteres.");
      }
      if (Number(cargoForm.cantidad) <= 0) {
        throw new Error("La cantidad debe ser mayor a cero.");
      }
      if (Number(cargoForm.precio_unitario) < 0) {
        throw new Error("El precio unitario no puede ser negativo.");
      }
      if (cargoForm.fecha_consumo) {
        const fechaConsumo = new Date(cargoForm.fecha_consumo);
        const ahora = new Date();
        const checkin = selectedEstadia.checkinUtc ? new Date(selectedEstadia.checkinUtc) : null;
        const checkout = selectedEstadia.checkoutUtc ? new Date(selectedEstadia.checkoutUtc) : null;

        if (Number.isNaN(fechaConsumo.getTime())) {
          throw new Error("La fecha de consumo no es válida.");
        }
        if (fechaConsumo > ahora) {
          throw new Error("La fecha de consumo no puede estar en el futuro.");
        }
        if (checkin && fechaConsumo < checkin) {
          throw new Error("La fecha de consumo no puede ser anterior al check-in.");
        }
        if (checkout && fechaConsumo > checkout) {
          throw new Error("La fecha de consumo no puede ser posterior al checkout.");
        }
      }

      await handleAddCargo(selectedEstadiaGuid, {
        catalogoGuid: cargoForm.catalogo_guid,
        descripcionCargo: cargoForm.descripcion_cargo.trim(),
        cantidad: Number(cargoForm.cantidad),
        precioUnitario: Number(cargoForm.precio_unitario),
      });

      setCargoForm(EMPTY_CARGO_FORM);
      setSuccess("Cargo registrado correctamente.");
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "No se pudo registrar el cargo.");
    }
  };

  const onVerDetalleCargo = async (cargoGuid) => {
    setActionError(null);
    setSuccess(null);
    try {
      const detalle = await getCargoEstadia(cargoGuid);
      setCargoDetalle(detalle);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo cargar el detalle del cargo.");
    }
  };

  const onAnularCargo = async (cargoGuid) => {
    if (!selectedEstadiaGuid) return;
    if (!window.confirm("¿Deseas anular este cargo?")) return;
    setActionError(null);
    setSuccess(null);
    try {
      await anularCargoEstadia(cargoGuid);
      await fetchCargos(selectedEstadiaGuid);
      setCargoDetalle(null);
      setSuccess("Cargo anulado correctamente.");
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo anular el cargo.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Estadías</h2>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && estadias.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              estadias.map((e) => (
                <tr key={e.estadiaGuid}>
                  <td>{e.checkinUtc ?? "Pendiente"}</td>
                  <td>{e.checkoutUtc ?? "Pendiente"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        e.estadoEstadia === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {e.estadoEstadia}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {e.estadoEstadia === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onCheckout(e.estadiaGuid)}
                        >
                          Checkout
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => onVerCargos(e.estadiaGuid)}
                      >
                        Ver cargos
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedEstadiaGuid && (
        <>
          <section className={styles.card}>
            <div className={styles.topBar}>
              <h3 className={styles.sectionTitle}>Cargos de estadía</h3>
            </div>
            {selectedEstadia && (
              <div className={styles.helpText}>
                Estado: {selectedEstadia.estadoEstadia} | Check-in: {selectedEstadia.checkinUtc ?? "N/A"}
              </div>
            )}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargosLoading && (
                    <tr>
                      <td colSpan={6} className={styles.loadingMsg}>
                        Cargando cargos...
                      </td>
                    </tr>
                  )}
                  {!cargosLoading && cargos.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.emptyMsg}>
                        No hay cargos registrados para esta estadía.
                      </td>
                    </tr>
                  )}
                  {!cargosLoading &&
                    cargos.map((cargo) => (
                      <tr key={cargo.cargoGuid}>
                        <td>{cargo.descripcionCargo}</td>
                        <td>{cargo.cantidad}</td>
                        <td>${cargo.precioUnitario}</td>
                        <td>${cargo.totalCargo}</td>
                        <td>{cargo.estadoCargo}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => onVerDetalleCargo(cargo.cargoGuid)}
                            >
                              Detalle
                            </button>
                            {cargo.estadoCargo === CARGO_ESTADIA_ESTADOS[0] && (
                              <button
                                type="button"
                                className={styles.btnDanger}
                                onClick={() => onAnularCargo(cargo.cargoGuid)}
                              >
                                Anular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {cargoDetalle && (
            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>Detalle del cargo</h3>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Estado</label>
                  <input value={cargoDetalle.estadoCargo ?? ""} readOnly />
                </div>
                <div className={styles.fieldFull}>
                  <label>Descripción</label>
                  <input value={cargoDetalle.descripcionCargo ?? ""} readOnly />
                </div>
                <div className={styles.field}>
                  <label>Cantidad</label>
                  <input value={cargoDetalle.cantidad ?? 0} readOnly />
                </div>
                <div className={styles.field}>
                  <label>Precio unitario</label>
                  <input value={cargoDetalle.precioUnitario ?? 0} readOnly />
                </div>
                <div className={styles.field}>
                  <label>IVA</label>
                  <input value={cargoDetalle.valorIva ?? 0} readOnly />
                </div>
                <div className={styles.field}>
                  <label>Total</label>
                  <input value={cargoDetalle.totalCargo ?? 0} readOnly />
                </div>
              </div>
            </section>
          )}

          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>Registrar cargo</h3>
            <form className={styles.grid2} onSubmit={onRegistrarCargo}>
              <div className={styles.field}>
                <label>Catálogo</label>
                <select
                  name="catalogo_guid"
                  value={cargoForm.catalogo_guid}
                  onChange={onChangeCargo}
                  disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                >
                  <option value="">Selecciona un ítem</option>
                  {catalogo.map((item) => (
                    <option key={item.catalogoGuid} value={item.catalogoGuid}>
                      {item.nombreCatalogo}
                      {item.idCatalogo ? ` - ID ${item.idCatalogo}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Fecha consumo</label>
                <input
                  type="datetime-local"
                  name="fecha_consumo"
                  value={cargoForm.fecha_consumo}
                  onChange={onChangeCargo}
                  disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                />
              </div>
              <div className={styles.fieldFull}>
                <label>Descripción</label>
                <input
                  name="descripcion_cargo"
                  value={cargoForm.descripcion_cargo}
                  onChange={onChangeCargo}
                  disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                />
              </div>
              <div className={styles.field}>
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  name="cantidad"
                  value={cargoForm.cantidad}
                  onChange={onChangeCargo}
                  disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                />
              </div>
              <div className={styles.field}>
                <label>Precio unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="precio_unitario"
                  value={cargoForm.precio_unitario}
                  onChange={onChangeCargo}
                  disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                />
              </div>
              <div className={styles.fieldFull}>
                <div className={styles.actions}>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={!selectedEstadia || selectedEstadia.estadoEstadia !== "ACT"}
                  >
                    Registrar cargo
                  </button>
                </div>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
