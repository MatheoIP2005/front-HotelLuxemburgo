import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccommodation, searchAccommodations } from '../../services/accommodations.service';
import useBooking from '../../hooks/useBooking';
import MinimalDateInput from '../../components/public/MinimalDateInput';
import Navbar from '../../components/public/Navbar';
import styles from './SearchPage.module.css';

const trimText = (value) => String(value ?? '').trim();

const getTodayIsoDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const addDaysToIsoDate = (isoDate, amount) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + amount);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextDay = String(nextDate.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const getOptionalChildrenCount = (value) =>
  value === '' || value === null || value === undefined ? 0 : Number(value);

const buildSearchQuery = (search) => {
  const params = new URLSearchParams({
    fechaInicio: search.fechaInicio,
    fechaFin: search.fechaFin,
    numAdultos: search.numAdultos,
    numHabitaciones: search.numHabitaciones,
  });

  if (search.numNinos !== '') {
    params.set('numNinos', search.numNinos);
  }

  return params.toString();
};

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
      nested?.sucursalImagenes,
      nested?.imagenesSucursal,
      nested?.imagenesPropiedad,
      nested?.propiedadImagenes,
      nested?.imagenes,
      nested?.galeria,
      nested?.fotos,
    ]
      .map((items) => getImageUrlFromCollection(items))
      .find(Boolean);

    if (nestedCollection) return nestedCollection;
  }

  return '';
};

const resolvePropertyImageUrl = (propiedad) => {
  const hydrated = getImageUrlFromRecord(propiedad, ['imagenSucursalResuelta']);
  if (hydrated) return hydrated;

  const direct = getImageUrlFromRecord(propiedad, [
    'sucursalImagenPrincipalUrl',
    'imagenSucursalPrincipalUrl',
    'imagenSucursalUrl',
    'urlImagenSucursal',
    'portadaSucursalUrl',
    'coverSucursalUrl',
  ]);
  if (direct) return direct;

  const nestedDirect = getImageUrlFromNestedObject(
    propiedad,
    ['sucursal', 'hotel', 'propiedad', 'accommodation', 'data'],
    [
      'sucursalImagenPrincipalUrl',
      'imagenSucursalPrincipalUrl',
      'imagenSucursalUrl',
      'urlImagenSucursal',
      'portadaSucursalUrl',
      'coverSucursalUrl',
      'imagenPrincipalUrl',
      'imagenUrl',
      'urlImagen',
    ]
  );
  if (nestedDirect) return nestedDirect;

  const collection = [
    propiedad?.sucursalImagenes,
    propiedad?.imagenesSucursal,
    propiedad?.imagenesPropiedad,
    propiedad?.propiedadImagenes,
    propiedad?.galeriaSucursal,
    propiedad?.fotosSucursal,
  ]
    .map((items) => getImageUrlFromCollection(items))
    .find(Boolean);
  if (collection) return collection;

  return getImageUrlFromRecord(propiedad, ['imagenPrincipalUrl']);
};

const formatLocation = (propiedad) =>
  [propiedad?.ciudad, propiedad?.pais].filter(Boolean).join(', ');

export default function SearchPage() {
  const navigate = useNavigate();
  const { setPropiedad, setFechas, setHuespedes } = useBooking();
  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const [search, setSearch] = useState({
    destino: '',
    fechaInicio: '',
    fechaFin: '',
    numAdultos: '1',
    numNinos: '',
    numHabitaciones: '1',
  });
  const [resultados, setResultados] = useState([]);
  const [totalResultados, setTotalResultados] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buscado, setBuscado] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.fechaInicio || !search.fechaFin) {
      setError('Selecciona fecha de entrada y salida.');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
      return;
    }

    if (search.fechaInicio < todayIso) {
      setError('La fecha de entrada no puede ser menor a la fecha actual.');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
      return;
    }

    if (search.fechaFin <= search.fechaInicio) {
      setError('La fecha de salida debe ser posterior a la fecha de entrada.');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
      return;
    }

    if (Number(search.numAdultos) < 1 || Number(search.numHabitaciones) < 1) {
      setError('Adultos y habitaciones deben ser mayores a cero.');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
      return;
    }

    if (search.numNinos !== '' && Number(search.numNinos) < 0) {
      setError('El número de niños no puede ser negativo.');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchAccommodations({
        ...search,
        numNinos: search.numNinos === '' ? undefined : search.numNinos,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      const enrichedResults = await Promise.all(
        items.map(async (item) => {
          const accommodationId = item.sucursalGuid ?? item.id ?? item.slug;
          if (!accommodationId) return item;

          try {
            const detail = await getAccommodation(accommodationId, {
              fechaInicio: search.fechaInicio,
              fechaFin: search.fechaFin,
            });

            return {
              ...item,
              imagenSucursalResuelta:
                trimText(detail?.imagenPrincipalUrl) ||
                getFirstStringImage(detail?.imagenes) ||
                '',
            };
          } catch {
            return item;
          }
        })
      );

      setResultados(enrichedResults);
      setTotalResultados(Number(response?.totalResultados ?? response?.total ?? items.length));
      setBuscado(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al buscar propiedades');
      setResultados([]);
      setTotalResultados(0);
      setBuscado(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFechaInicioChange = (nextValue) => {
    setSearch((prev) => {
      if (!nextValue) {
        return { ...prev, fechaInicio: '', fechaFin: '' };
      }

      return {
        ...prev,
        fechaInicio: nextValue,
        fechaFin: prev.fechaFin && prev.fechaFin <= nextValue ? '' : prev.fechaFin,
      };
    });
  };

  const handleFechaFinChange = (nextValue) => {
    setSearch((prev) => ({ ...prev, fechaFin: nextValue }));
  };

  const handleSelectPropiedad = (propiedad) => {
    setPropiedad(propiedad);
    setFechas(search.fechaInicio, search.fechaFin);
    setHuespedes(
      Number(search.numAdultos),
      Number(search.numHabitaciones),
      getOptionalChildrenCount(search.numNinos)
    );
    const accommodationId = propiedad.sucursalGuid ?? propiedad.id ?? propiedad.slug;
    navigate(`/buscar/${accommodationId}?${buildSearchQuery(search)}`);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <h1>Encuentra tu alojamiento ideal</h1>
        <p>Busca entre nuestras propiedades disponibles</p>

        <form className={styles.searchBox} onSubmit={handleSearch}>
          <div className={styles.searchField}>
            <label htmlFor="destino">Destino</label>
            <input
              id="destino"
              type="text"
              value={search.destino}
              onChange={(e) => setSearch((prev) => ({ ...prev, destino: e.target.value }))}
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="fecha_entrada">Entrada</label>
            <MinimalDateInput
              id="fecha_entrada"
              value={search.fechaInicio}
              onChange={handleFechaInicioChange}
              minDate={todayIso}
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="fecha_salida">Salida</label>
            <MinimalDateInput
              id="fecha_salida"
              value={search.fechaFin}
              onChange={handleFechaFinChange}
              minDate={search.fechaInicio ? addDaysToIsoDate(search.fechaInicio, 1) : todayIso}
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="num_adultos">Adultos</label>
            <input
              id="num_adultos"
              type="number"
              min="1"
              required
              value={search.numAdultos}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, numAdultos: e.target.value }))
              }
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="num_ninos">Niños</label>
            <input
              id="num_ninos"
              type="number"
              min="0"
              placeholder="0"
              value={search.numNinos}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, numNinos: e.target.value }))
              }
            />
          </div>

          <button type="submit" className={styles.searchBtn}>
            Buscar
          </button>
        </form>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.resultsHeader}>
          <h2>
            {buscado
              ? `${totalResultados} propiedades encontradas`
              : 'Ingresa tu destino para buscar'}
          </h2>
        </div>

        {loading && <div className={styles.loadingMsg}>Buscando...</div>}
        {!loading && buscado && resultados.length === 0 && (
          <div className={styles.emptyMsg}>No se encontraron propiedades</div>
        )}

        <div className={styles.grid}>
          {resultados.map((p) => (
            <div
              key={p.sucursalGuid}
              className={styles.card}
              onClick={() => handleSelectPropiedad(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectPropiedad(p);
                }
              }}
            >
              <div className={styles.cardImg}>
                {resolvePropertyImageUrl(p) ? (
                  <img src={resolvePropertyImageUrl(p)} alt={trimText(p.nombre) || 'Propiedad'} />
                ) : (
                  '🏨 Sin imagen'
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <h3>{p.nombre}</h3>
                    <p className={styles.cardLocation}>{formatLocation(p)}</p>
                    <span className={styles.cardType}>{p.tipoAlojamiento}</span>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.ratingBadge}>{p.promedioValoracion ?? '-'}</span>
                    <span className={styles.ratingLabel}>Valoración promedio</span>
                    <p className={styles.cardPrice}>
                      {p.precioDesde ?? 0} <span className={styles.cardPriceSub}>/noche</span>
                    </p>
                    <p className={styles.cardPriceLabel}>precio por noche</p>
                  </div>
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.stars}>
                    {p.estrellas ? '★'.repeat(p.estrellas) : 'Sin clasificar'}
                  </span>
                  <span>
                    {typeof p.habitacionesDisponibles === 'number'
                      ? `${p.habitacionesDisponibles} disponibles`
                      : ''}
                  </span>
                  <button type="button" className={styles.verBtn}>
                    Ver disponibilidad →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
