import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getAccommodation } from '../../services/accommodations.service';
import useBooking from '../../hooks/useBooking';
import Navbar from '../../components/public/Navbar';
import styles from './AccommodationDetailPage.module.css';

const formatLocation = (propiedad) =>
  [propiedad?.ciudad, propiedad?.pais].filter(Boolean).join(', ');

const normalizeRoomOptions = (propiedad) => {
  const tiposHabitacion = Array.isArray(propiedad?.tiposHabitacion)
    ? propiedad.tiposHabitacion
    : [];
  const tarifasActivas = Array.isArray(propiedad?.tarifasActivas)
    ? propiedad.tarifasActivas
    : [];

  if (tiposHabitacion.length > 0) {
    return tiposHabitacion.map((tipo) => {
      const tarifaRelacionada =
        tarifasActivas.find(
          (tarifa) => tarifa.tipoHabitacionGuid === tipo.tipoHabitacionGuid
        ) ?? tarifasActivas[0] ?? null;

      return {
        id: tipo.tipoHabitacionGuid ?? tarifaRelacionada?.tarifaGuid,
        nombre: tipo.nombreTipoHabitacion ?? tipo.nombre ?? 'Tipo de habitación',
        descripcion: tipo.descripcion ?? '',
        tipoCama: tipo.tipoCama ?? 'N/A',
        capacidad: tipo.capacidadTotal ?? tipo.capacidadHabitacion ?? tipo.capacidad ?? 'N/A',
        precioPorNoche:
          tarifaRelacionada?.precioPorNoche ??
          tipo.precioDesde ??
          propiedad?.precioDesde ??
          0,
        tipoHabitacionGuid: tipo.tipoHabitacionGuid ?? null,
        habitacionGuid: tipo.habitacionGuid ?? null,
        tarifaGuid: tarifaRelacionada?.tarifaGuid ?? tipo.tarifaGuid ?? null,
      };
    });
  }

  if (Array.isArray(propiedad?.habitacionesDisponibles)) {
    return propiedad.habitacionesDisponibles.map((habitacion) => ({
      id: habitacion.habitacionGuid ?? habitacion.tipoHabitacionGuid,
      nombre: habitacion.nombre ?? habitacion.numeroHabitacion ?? 'Habitación disponible',
      descripcion: habitacion.descripcionHabitacion ?? '',
      tipoCama: habitacion.tipoCama ?? 'N/A',
      capacidad:
        habitacion.capacidadHabitacion ??
        habitacion.capacidadTotal ??
        habitacion.capacidad ??
        'N/A',
      precioPorNoche:
        habitacion.precioPorNoche ??
        habitacion.precioDesde ??
        propiedad?.precioDesde ??
        0,
      tipoHabitacionGuid: habitacion.tipoHabitacionGuid ?? null,
      habitacionGuid: habitacion.habitacionGuid ?? null,
      tarifaGuid: habitacion.tarifaGuid ?? tarifasActivas[0]?.tarifaGuid ?? null,
    }));
  }

  return [];
};

export default function AccommodationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fechaEntrada = searchParams.get('fechaInicio') || searchParams.get('fecha_entrada');
  const fechaSalida = searchParams.get('fechaFin') || searchParams.get('fecha_salida');
  const { setPropiedad, setHabitacion, setPrecioTotal } = useBooking();

  const [propiedad, setPropiedadState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sinDisponibilidad, setSinDisponibilidad] = useState(false);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);

  useEffect(() => {
    const fetchAccommodation = async () => {
      setLoading(true);
      setError(null);
      setSinDisponibilidad(false);
      try {
        const response =
          fechaEntrada && fechaSalida
            ? await getAccommodation(id, {
                fechaInicio: fechaEntrada,
                fechaFin: fechaSalida,
              })
            : await getAccommodation(id);
        setPropiedadState(response || null);
      } catch (err) {
        if (err?.response?.status === 409) {
          setPropiedadState(err?.response?.data?.data ?? err?.response?.data ?? null);
          setSinDisponibilidad(true);
          setError(null);
        } else {
          setError(err?.response?.data?.message || 'No se pudo cargar la propiedad');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [id, fechaEntrada, fechaSalida]);

  const handleSeleccionarHabitacion = (hab) => {
    setHabitacionSeleccionada(hab);
  };

  const handleReservar = () => {
    if (!propiedad) return;

    const roomOptions = normalizeRoomOptions(propiedad);
    const habitacionesDisponibles =
      typeof propiedad.habitacionesDisponibles === 'number'
        ? propiedad.habitacionesDisponibles
        : roomOptions.length;
    const hayUnidadesDisponibles = habitacionesDisponibles > 0;

    const habitacionParaReserva =
      habitacionSeleccionada ||
      (hayUnidadesDisponibles
        ? {
            id: null,
            nombre: 'Habitación por asignar',
            precioPorNoche: propiedad.precioDesde || 0,
            tipoHabitacionGuid: roomOptions[0]?.tipoHabitacionGuid ?? null,
            habitacionGuid: roomOptions[0]?.habitacionGuid ?? null,
            tarifaGuid: roomOptions[0]?.tarifaGuid ?? null,
          }
        : null);

    if (!habitacionParaReserva) return;

    setPropiedad(propiedad);
    setHabitacion(habitacionParaReserva);
    setPrecioTotal(habitacionParaReserva.precioPorNoche || propiedad.precioDesde || 0);
    navigate('/reservar');
  };

  const roomOptions = normalizeRoomOptions(propiedad);
  const habitacionesDisponibles = typeof propiedad?.habitacionesDisponibles === 'number'
    ? propiedad.habitacionesDisponibles
    : roomOptions.length;
  const hayUnidadesDisponibles = habitacionesDisponibles > 0;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/buscar')}>
          ← Volver
        </button>
        <h2>{propiedad?.nombre || 'Detalle de propiedad'}</h2>
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.noSelection}>Cargando propiedad...</div>}
        {error && <div className={styles.noSelection}>{error}</div>}

        {!loading && !error && propiedad && (
          <div className={styles.mainGrid}>
            <div className={styles.left}>
              <div className={styles.card}>
                <h1 className={styles.propName}>{propiedad.nombre}</h1>
                <p className={styles.propLocation}>{formatLocation(propiedad)}</p>
                <div className={styles.ratingRow}>
                  <span className={styles.ratingBadge}>
                    {propiedad.promedioValoracion ?? '-'}
                  </span>
                  <span className={styles.ratingLabel}>Valoración promedio</span>
                </div>
                <p className={styles.propDesc}>
                  {propiedad.descripcionCorta || propiedad.descripcionCompleta}
                </p>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Habitaciones disponibles</h3>
                {sinDisponibilidad ? (
                  <div className={styles.noSelection}>
                    No hay habitaciones disponibles para las fechas seleccionadas. Prueba con
                    otras fechas.
                  </div>
                ) : roomOptions.length === 0 && habitacionesDisponibles > 0 ? (
                  <div className={styles.noSelection}>
                    {habitacionesDisponibles} habitaciones disponibles
                  </div>
                ) : roomOptions.length > 0 ? (
                  roomOptions.map((hab) => (
                    <div
                      key={hab.id}
                      className={styles.roomCard}
                      style={{
                        borderColor:
                          habitacionSeleccionada?.id === hab.id ? '#7c83fd' : '#eee',
                      }}
                    >
                      <div className={styles.roomInfo}>
                        <h4>{hab.nombre}</h4>
                        <p>{hab.tipoCama}</p>
                        {hab.descripcion && <p>{hab.descripcion}</p>}
                        <p>Capacidad: {hab.capacidad}</p>
                      </div>
                      <div className={styles.roomPrice}>
                        <strong>{hab.precioPorNoche}</strong>
                        <span>/noche</span>
                        <button
                          type="button"
                          className={styles.selectRoomBtn}
                          onClick={() => handleSeleccionarHabitacion(hab)}
                        >
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noSelection}>
                    Contacta con el hotel para ver habitaciones disponibles
                  </div>
                )}
              </div>
            </div>

            <div className={styles.stickyCard}>
              <h3>Tu selección</h3>
              {!habitacionSeleccionada && !hayUnidadesDisponibles && (
                <div className={styles.noSelection}>Selecciona una habitación para continuar</div>
              )}

              {habitacionSeleccionada && (
                <>
                  <div className={styles.summaryRow}>
                    <span>Propiedad</span>
                    <span>{propiedad.nombre}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Habitación</span>
                    <span>{habitacionSeleccionada.nombre}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Precio/noche</span>
                    <span>{habitacionSeleccionada.precioPorNoche}</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <span>Total</span>
                    <span>{habitacionSeleccionada.precioPorNoche}</span>
                  </div>
                </>
              )}

              {!habitacionSeleccionada && hayUnidadesDisponibles && (
                <>
                  <div className={styles.summaryRow}>
                    <span>Propiedad</span>
                    <span>{propiedad.nombre}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Disponibilidad</span>
                    <span>{habitacionesDisponibles} habitaciones</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <span>Desde</span>
                    <span>{propiedad.precioDesde}</span>
                  </div>
                </>
              )}

              <button
                type="button"
                className={styles.bookBtn}
                disabled={!habitacionSeleccionada && !hayUnidadesDisponibles}
                onClick={handleReservar}
              >
                {hayUnidadesDisponibles ? 'Reservar ahora' : 'Continuar con la reserva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
