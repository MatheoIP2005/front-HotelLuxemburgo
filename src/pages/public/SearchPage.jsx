import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAccommodations } from '../../services/accommodations.service';
import useBooking from '../../hooks/useBooking';
import Navbar from '../../components/public/Navbar';
import styles from './SearchPage.module.css';

const formatLocation = (propiedad) =>
  [propiedad?.ciudad, propiedad?.pais].filter(Boolean).join(', ');

export default function SearchPage() {
  const navigate = useNavigate();
  const { setPropiedad, setFechas, setHuespedes } = useBooking();

  const [search, setSearch] = useState({
    destino: '',
    fechaInicio: '',
    fechaFin: '',
    numAdultos: '1',
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

    setLoading(true);
    setError(null);

    try {
      const response = await searchAccommodations(search);
      const items = Array.isArray(response?.items) ? response.items : [];
      setResultados(items);
      setTotalResultados(Number(response?.total ?? items.length));
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

  const handleSelectPropiedad = (propiedad) => {
    setPropiedad(propiedad);
    setFechas(search.fechaInicio, search.fechaFin);
    setHuespedes(Number(search.numAdultos), Number(search.numHabitaciones), 0);
    const accommodationId = propiedad.sucursalGuid ?? propiedad.id ?? propiedad.slug;
    navigate(
      `/buscar/${accommodationId}?fechaInicio=${search.fechaInicio}&fechaFin=${search.fechaFin}`
    );
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
            <input
              id="fecha_entrada"
              type="date"
              value={search.fechaInicio}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, fechaInicio: e.target.value }))
              }
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="fecha_salida">Salida</label>
            <input
              id="fecha_salida"
              type="date"
              value={search.fechaFin}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, fechaFin: e.target.value }))
              }
            />
          </div>

          <div className={styles.searchField}>
            <label htmlFor="num_adultos">Adultos</label>
            <input
              id="num_adultos"
              type="number"
              min="1"
              value={search.numAdultos}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, numAdultos: e.target.value }))
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
                {p.imagenPrincipalUrl ? (
                  <img src={p.imagenPrincipalUrl} alt={p.nombre} />
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
