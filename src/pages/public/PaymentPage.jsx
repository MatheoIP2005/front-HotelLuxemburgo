import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBooking from '../../hooks/useBooking';
import { createPublicReserva } from '../../services/publicReservas.service';
import Navbar from '../../components/public/Navbar';
import styles from './PaymentPage.module.css';

const CARD_NUMBER_REGEX = /^\d{16}$/;
const CVV_REGEX = /^\d{3,4}$/;

const sanitizeDigits = (value) => String(value || '').replace(/\D/g, '');

const formatCardNumber = (value) =>
  sanitizeDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

const randomToken = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const isExpiryValid = (value) => {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { bookingData, setPublicReservation, setSimulatedPayment } = useBooking();

  useEffect(() => {
    if (!bookingData.cliente) {
      navigate('/reservar');
    }
  }, [bookingData.cliente, navigate]);

  const [form, setForm] = useState({
    numero_tarjeta: '',
    nombre_titular: '',
    fecha_vencimiento: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingState, setProcessingState] = useState('idle');
  const [simulationInfo, setSimulationInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'numero_tarjeta') {
      setForm((prev) => ({ ...prev, [name]: formatCardNumber(value) }));
      return;
    }

    if (name === 'cvv') {
      setForm((prev) => ({ ...prev, [name]: sanitizeDigits(value).slice(0, 4) }));
      return;
    }

    if (name === 'fecha_vencimiento') {
      const normalized = sanitizeDigits(value).slice(0, 4);
      const formatted =
        normalized.length > 2
          ? `${normalized.slice(0, 2)}/${normalized.slice(2)}`
          : normalized;
      setForm((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePagar = async (e) => {
    e.preventDefault();
    const numeroTarjeta = sanitizeDigits(form.numero_tarjeta);
    const cvv = sanitizeDigits(form.cvv);
    const nombreTitular = form.nombre_titular.trim();
    const fechaVencimiento = form.fecha_vencimiento.trim();
    const tipoHabitacionGuid = bookingData.habitacion?.tipoHabitacionGuid;

    if (!nombreTitular) {
      setError('El nombre del titular es obligatorio.');
      return;
    }
    if (!CARD_NUMBER_REGEX.test(numeroTarjeta)) {
      setError('La tarjeta simulada debe tener exactamente 16 dígitos.');
      return;
    }
    if (!CVV_REGEX.test(cvv)) {
      setError('El CVV simulado debe tener 3 o 4 dígitos.');
      return;
    }
    if (!isExpiryValid(fechaVencimiento)) {
      setError('La fecha de vencimiento debe tener formato MM/AA y no estar vencida.');
      return;
    }
    if (!bookingData.propiedad?.sucursalGuid || !bookingData.fechaEntrada || !bookingData.fechaSalida) {
      setError('Faltan datos de la reserva para continuar.');
      return;
    }
    if (!tipoHabitacionGuid) {
      setError('No se pudo resolver el tipo de habitación para crear la reserva.');
      return;
    }

    setError(null);
    setLoading(true);
    setProcessingState('validating');
    setSimulationInfo(null);

    try {
      const authorizationCode = randomToken('AUTH');
      const transactionCode = randomToken('TXN');
      setSimulationInfo({
        authorizationCode,
        transactionCode,
        maskedCard: `**** **** **** ${numeroTarjeta.slice(-4)}`,
      });

      setProcessingState('processing');
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      const reserva = await createPublicReserva({
        cliente: {
          tipoIdentificacion: bookingData.cliente?.tipo_identificacion,
          numeroIdentificacion: bookingData.cliente?.numero_identificacion,
          nombres: bookingData.cliente?.nombres,
          apellidos: bookingData.cliente?.apellidos || '',
          correo: bookingData.cliente?.correo,
          telefono: bookingData.cliente?.telefono,
          direccion: bookingData.cliente?.direccion,
        },
        sucursalGuid: bookingData.propiedad?.sucursalGuid,
        fechaInicio: bookingData.fechaEntrada,
        fechaFin: bookingData.fechaSalida,
        origenCanalReserva: 'PORTAL',
        esWalkin: false,
        observaciones: null,
        habitaciones: [
          {
            tipoHabitacionGuid: bookingData.habitacion?.tipoHabitacionGuid ?? null,
            numHabitaciones: bookingData.numHabitaciones || 1,
            numAdultos: bookingData.numAdultos || 1,
            numNinos: bookingData.numNinos || 0,
          },
        ],
      });

      setPublicReservation(reserva);
      setSimulatedPayment({
        authorizationCode,
        transactionCode,
        maskedCard: `**** **** **** ${numeroTarjeta.slice(-4)}`,
        nombreTitular,
        fechaVencimiento,
        metodo: 'TARJETA SIMULADA',
      });
      setProcessingState('success');
      navigate('/confirmacion');
    } catch (err) {
      setProcessingState('error');
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'No se pudo completar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/reservar')}>
          ← Volver
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.simulatedBadge}>
          Pasarela de pago simulada. No ingreses datos reales.
        </div>

        <div className={styles.summaryBox}>
          <div className={styles.summaryRow}>
            <span>Propiedad</span>
            <span>{bookingData.propiedad?.nombre || '-'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Habitación</span>
            <span>{bookingData.habitacion?.nombre || '-'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Fechas</span>
            <span>
              {bookingData.fechaEntrada || '-'} - {bookingData.fechaSalida || '-'}
            </span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>{bookingData.precioTotal || 0}</span>
          </div>
        </div>

        <form className={styles.card} onSubmit={handlePagar}>
          <h3 className={styles.cardTitle}>Datos de pago</h3>
          <div className={styles.grid2}>
            <div className={styles.fieldFull}>
              <label htmlFor="numero_tarjeta">Número de tarjeta</label>
              <input
                id="numero_tarjeta"
                name="numero_tarjeta"
                placeholder="1234 5678 9012 3456"
                value={form.numero_tarjeta}
                onChange={handleChange}
                inputMode="numeric"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="nombre_titular">Nombre del titular</label>
              <input
                id="nombre_titular"
                name="nombre_titular"
                value={form.nombre_titular}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="fecha_vencimiento">Fecha de vencimiento</label>
              <input
                id="fecha_vencimiento"
                name="fecha_vencimiento"
                placeholder="MM/AA"
                value={form.fecha_vencimiento}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                name="cvv"
                placeholder="123"
                value={form.cvv}
                onChange={handleChange}
                inputMode="numeric"
              />
            </div>
          </div>

          {processingState !== 'idle' && (
            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span>Estado</span>
                <span>
                  {processingState === 'validating'
                    ? 'Validando datos simulados...'
                    : processingState === 'processing'
                      ? 'Procesando pago simulado...'
                      : processingState === 'success'
                        ? 'Pago simulado aprobado.'
                        : 'Error en la simulación.'}
                </span>
              </div>
              {simulationInfo && (
                <>
                  <div className={styles.infoRow}>
                    <span>Autorización</span>
                    <span>{simulationInfo.authorizationCode}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Transacción</span>
                    <span>{simulationInfo.transactionCode}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Tarjeta</span>
                    <span>{simulationInfo.maskedCard}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/reservar')}
              disabled={loading}
            >
              Volver
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              Confirmar y pagar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
