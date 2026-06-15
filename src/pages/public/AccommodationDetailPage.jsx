import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getAccommodation } from '../../services/accommodations.service';
import { resolveLocalTipoHabitacionImagePath } from '../../shared/utils/localImages';
import useBooking from '../../hooks/useBooking';
import Navbar from '../../components/public/Navbar';
import styles from './AccommodationDetailPage.module.css';

const trimText = (value) => String(value ?? '').trim();

const getImageUrlFromRecord = (record, directKeys = []) => {
  for (const key of directKeys) {
    const candidate = record?.[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

const getFirstStringImage = (items) =>
  Array.isArray(items)
    ? items.find((item) => typeof item === 'string' && item.trim())?.trim() || ''
    : '';

const getImageUrlFromCollection = (collection) => {
  if (!Array.isArray(collection) || collection.length === 0) return '';

  const directStringImage = getFirstStringImage(collection);
  if (directStringImage) return directStringImage;

  const principal =
    collection.find((item) => item?.esPrincipal || item?.es_principal || item?.principal) ??
    collection[0];

  return getImageUrlFromRecord(principal, [
    'urlImagen',
    'url_imagen',
    'imagenUrl',
    'imagen_url',
    'secureUrl',
    'url',
  ]);
};

const getImageUrlFromNestedObject = (source, nestedKeys = [], directKeys = []) => {
  for (const key of nestedKeys) {
    const nested = source?.[key];
    if (!nested || typeof nested !== 'object') continue;

    const direct = getImageUrlFromRecord(nested, directKeys);
    if (direct) return direct;

    const nestedCollection = [
      nested?.tipoHabitacionImagenes,
      nested?.imagenesTipoHabitacion,
      nested?.habitacionImagenes,
      nested?.imagenesHabitacion,
      nested?.imagenes,
      nested?.galeria,
      nested?.fotos,
      nested?.sucursalImagenes,
      nested?.imagenesSucursal,
    ]
      .map((items) => getImageUrlFromCollection(items))
      .find(Boolean);

    if (nestedCollection) return nestedCollection;
  }

  return '';
};

const resolveRoomImageUrl = (room, propiedad) => {
  const direct = getImageUrlFromRecord(room, [
    'tipoHabitacionImagenPrincipalUrl',
    'tipoHabitacionImagenUrl',
    'habitacionImagenPrincipalUrl',
    'habitacionImagenUrl',
    'portadaHabitacionUrl',
    'coverHabitacionUrl',
    'fotoHabitacionUrl',
    'fotoTipoHabitacionUrl',
    'imagenPrincipalUrl',
    'imagenTipoHabitacionUrl',
    'imagenHabitacionUrl',
    'urlImagen',
    'imagenUrl',
  ]);
  if (direct) return direct;

  const nestedDirect = getImageUrlFromNestedObject(
    room,
    ['tipoHabitacion', 'habitacion', 'roomType', 'room', 'tipo', 'detalle', 'data'],
    [
      'tipoHabitacionImagenPrincipalUrl',
      'tipoHabitacionImagenUrl',
      'habitacionImagenPrincipalUrl',
      'habitacionImagenUrl',
      'portadaHabitacionUrl',
      'coverHabitacionUrl',
      'fotoHabitacionUrl',
      'fotoTipoHabitacionUrl',
      'imagenPrincipalUrl',
      'imagenTipoHabitacionUrl',
      'imagenHabitacionUrl',
      'imagenUrl',
      'urlImagen',
    ]
  );
  if (nestedDirect) return nestedDirect;

  const nested = [
    room?.tipoHabitacionImagenes,
    room?.imagenesTipoHabitacion,
    room?.habitacionImagenes,
    room?.imagenesHabitacion,
    room?.imagenes,
    room?.galeria,
    room?.fotos,
  ]
    .map((items) => getImageUrlFromCollection(items))
    .find(Boolean);
  if (nested) return nested;

  const matchingTipo = Array.isArray(propiedad?.tiposHabitacion)
    ? propiedad.tiposHabitacion.find(
        (tipo) =>
          String(tipo?.tipoHabitacionGuid ?? '') === String(room?.tipoHabitacionGuid ?? '')
      )
    : null;

  if (matchingTipo && matchingTipo !== room) {
    const matchingTipoImage = resolveRoomImageUrl(matchingTipo, null);
    if (matchingTipoImage) return matchingTipoImage;
  }

  const propertyRoomImages = [
    propiedad?.tipoHabitacionImagenes,
    propiedad?.imagenesTipoHabitacion,
    propiedad?.habitacionImagenes,
    propiedad?.imagenesHabitacion,
  ]
    .flatMap((items) => (Array.isArray(items) ? items : []))
    .filter((item) => {
      const tipoGuid = item?.tipoHabitacionGuid ?? item?.tipo_habitacion_guid;
      const habitacionGuid = item?.habitacionGuid ?? item?.habitacion_guid;
      return (
        (tipoGuid && String(tipoGuid) === String(room?.tipoHabitacionGuid ?? '')) ||
        (habitacionGuid && String(habitacionGuid) === String(room?.habitacionGuid ?? ''))
      );
    });

  const matchedImage = getImageUrlFromCollection(propertyRoomImages);
  if (matchedImage) return matchedImage;

  return resolveLocalTipoHabitacionImagePath(room);
};

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
          tipo.precioBase ??
          propiedad?.precioDesde ??
          0,
        disponiblesEnRango: Number(tipo.disponiblesEnRango ?? tipo.disponibles ?? 0),
        tipoHabitacionGuid: tipo.tipoHabitacionGuid ?? null,
        habitacionGuid: tipo.habitacionGuid ?? null,
        tarifaGuid: tarifaRelacionada?.tarifaGuid ?? tipo.tarifaGuid ?? null,
        imagenUrl:
          getFirstStringImage(tipo.imagenes) ||
          resolveRoomImageUrl(tipo, propiedad),
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
        habitacion.precioBase ??
        propiedad?.precioDesde ??
        0,
      disponiblesEnRango: Number(habitacion.disponiblesEnRango ?? habitacion.disponibles ?? 1),
      tipoHabitacionGuid: habitacion.tipoHabitacionGuid ?? null,
      habitacionGuid: habitacion.habitacionGuid ?? null,
      tarifaGuid: habitacion.tarifaGuid ?? tarifasActivas[0]?.tarifaGuid ?? null,
      imagenUrl:
        getFirstStringImage(habitacion.imagenes) ||
        resolveRoomImageUrl(habitacion, propiedad),
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
  const numAdultos = searchParams.get('numAdultos') || searchParams.get('num_adultos');
  const numNinos = searchParams.get('numNinos') || searchParams.get('num_ninos');
  const numHabitaciones =
    searchParams.get('numHabitaciones') || searchParams.get('num_habitaciones');
  const { bookingData, setPropiedad, setHabitacion, setPrecioTotal } = useBooking();

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
      setHabitacionSeleccionada(null);
      try {
        const response =
          fechaEntrada && fechaSalida
            ? await getAccommodation(id, {
                fechaInicio: fechaEntrada,
                fechaFin: fechaSalida,
                numAdultos,
                numNinos,
                numHabitaciones,
              })
            : await getAccommodation(id);
        setPropiedadState(response || null);
      } catch (err) {
        if (err?.response?.status === 409) {
          setPropiedadState(err?.response?.data?.data ?? err?.response?.data ?? null);
          setSinDisponibilidad(true);
          setError(null);
        } else if (err?.response?.status === 429) {
          setError(
            'El servidor esta limitando temporalmente las consultas. Espera unos segundos e intenta nuevamente.'
          );
        } else {
          setError(err?.response?.data?.message || 'No se pudo cargar la propiedad');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [id, fechaEntrada, fechaSalida, numAdultos, numNinos, numHabitaciones]);

  const handleSeleccionarHabitacion = (hab) => {
    if (Number(hab?.disponiblesEnRango ?? 1) <= 0) return;
    setHabitacionSeleccionada(hab);
  };

  const handleReservar = () => {
    if (!propiedad) return;

    const roomOptions = normalizeRoomOptions(propiedad);
    const habitacionesSolicitadas = Number(bookingData.numHabitaciones || 1);
    const roomOptionsDisponibles = roomOptions.filter(
      (room) => Number(room.disponiblesEnRango ?? 1) >= habitacionesSolicitadas
    );
    const habitacionesDisponibles =
      roomOptions.length > 0
        ? roomOptionsDisponibles.length
        : typeof propiedad.habitacionesDisponibles === 'number'
          ? propiedad.habitacionesDisponibles
          : 0;
    const hayUnidadesDisponibles = habitacionesDisponibles > 0;
    const seleccionDisponible =
      habitacionSeleccionada &&
      Number(habitacionSeleccionada.disponiblesEnRango ?? 1) >= habitacionesSolicitadas;

    const habitacionParaReserva =
      (seleccionDisponible ? habitacionSeleccionada : null) ||
      (hayUnidadesDisponibles
        ? {
            id: null,
            nombre: 'Habitación por asignar',
            precioPorNoche: roomOptionsDisponibles[0]?.precioPorNoche ?? propiedad.precioDesde ?? 0,
            disponiblesEnRango: roomOptionsDisponibles[0]?.disponiblesEnRango ?? habitacionesDisponibles,
            tipoHabitacionGuid: roomOptionsDisponibles[0]?.tipoHabitacionGuid ?? null,
            habitacionGuid: roomOptionsDisponibles[0]?.habitacionGuid ?? null,
            tarifaGuid: roomOptionsDisponibles[0]?.tarifaGuid ?? null,
          }
        : null);

    if (!habitacionParaReserva) return;

    setPropiedad(propiedad);
    setHabitacion(habitacionParaReserva);
    setPrecioTotal(habitacionParaReserva.precioPorNoche || propiedad.precioDesde || 0);
    navigate('/reservar');
  };

  const roomOptions = normalizeRoomOptions(propiedad);
  const habitacionesSolicitadas = Number(bookingData.numHabitaciones || 1);
  const roomOptionsDisponibles = roomOptions.filter(
    (room) => Number(room.disponiblesEnRango ?? 1) >= habitacionesSolicitadas
  );
  const habitacionesDisponibles = roomOptions.length > 0
    ? roomOptionsDisponibles.length
    : typeof propiedad?.habitacionesDisponibles === 'number'
      ? propiedad.habitacionesDisponibles
      : 0;
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
                  roomOptions.map((hab) => {
                    const disponibles = Number(hab.disponiblesEnRango ?? 1);
                    const disponible = disponibles >= habitacionesSolicitadas;
                    return (
                    <div
                      key={hab.id}
                      className={`${styles.roomCard} ${!disponible ? styles.roomCardUnavailable : ''}`}
                      style={{
                        borderColor:
                          habitacionSeleccionada?.id === hab.id ? '#7c83fd' : '#eee',
                      }}
                    >
                      <div className={styles.roomMedia}>
                        {hab.imagenUrl ? (
                          <img
                            src={hab.imagenUrl}
                            alt={trimText(hab.nombre) || 'Habitación disponible'}
                          />
                        ) : (
                          <div className={styles.roomImageFallback}>Sin imagen</div>
                        )}
                      </div>
                      <div className={styles.roomInfo}>
                        <h4>{hab.nombre}</h4>
                        <p>{hab.tipoCama}</p>
                        {hab.descripcion && <p>{hab.descripcion}</p>}
                        <p>Capacidad: {hab.capacidad}</p>
                        <p>
                          {disponible
                            ? `${hab.disponiblesEnRango} disponibles en tus fechas`
                            : 'Sin disponibilidad en tus fechas'}
                        </p>
                      </div>
                      <div className={styles.roomPrice}>
                        <strong>{hab.precioPorNoche}</strong>
                        <span>/noche</span>
                        <button
                          type="button"
                          className={styles.selectRoomBtn}
                          disabled={!disponible}
                          onClick={() => handleSeleccionarHabitacion(hab)}
                        >
                          {disponible ? 'Seleccionar' : 'No disponible'}
                        </button>
                      </div>
                    </div>
                    );
                  })
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
