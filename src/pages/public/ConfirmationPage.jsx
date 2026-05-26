import { useNavigate } from 'react-router-dom';
import useBooking from '../../hooks/useBooking';
import Navbar from '../../components/public/Navbar';
import styles from './ConfirmationPage.module.css';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingData, resetBooking } = useBooking();
  const reservaInfo = {
    propiedad: bookingData.propiedad?.nombre,
    habitacion: bookingData.habitacion?.nombre,
    fechaEntrada: bookingData.fechaEntrada,
    fechaSalida: bookingData.fechaSalida,
    total: bookingData.precioTotal,
    reservaGuid: bookingData.publicReservation?.reservaGuid ?? null,
    codigoReserva: bookingData.publicReservation?.codigoReserva ?? null,
    authorizationCode: bookingData.simulatedPayment?.authorizationCode ?? null,
    transactionCode: bookingData.simulatedPayment?.transactionCode ?? null,
    tarjeta: bookingData.simulatedPayment?.maskedCard ?? null,
  };

  const handleNuevaBusqueda = () => {
    resetBooking();
    navigate('/buscar');
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h2>¡Reserva confirmada!</h2>
        <p>
          Tu reserva ha sido registrada exitosamente. Recibirás un correo de confirmación.
        </p>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <span>Propiedad</span>
            <span>{reservaInfo?.propiedad || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Habitación</span>
            <span>{reservaInfo?.habitacion || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Fechas</span>
            <span>
              {reservaInfo?.fechaEntrada || '-'} - {reservaInfo?.fechaSalida || '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span>Total</span>
            <span>{reservaInfo?.total || 0}</span>
          </div>
          {reservaInfo?.codigoReserva && (
            <div className={styles.infoRow}>
              <span>Código reserva</span>
              <span>{reservaInfo.codigoReserva}</span>
            </div>
          )}
          {reservaInfo?.reservaGuid && (
            <div className={styles.infoRow}>
              <span>Reserva GUID</span>
              <span>{reservaInfo.reservaGuid}</span>
            </div>
          )}
          {reservaInfo?.authorizationCode && (
            <div className={styles.infoRow}>
              <span>Autorización simulada</span>
              <span>{reservaInfo.authorizationCode}</span>
            </div>
          )}
          {reservaInfo?.transactionCode && (
            <div className={styles.infoRow}>
              <span>Transacción simulada</span>
              <span>{reservaInfo.transactionCode}</span>
            </div>
          )}
          {reservaInfo?.tarjeta && (
            <div className={styles.infoRow}>
              <span>Tarjeta</span>
              <span>{reservaInfo.tarjeta}</span>
            </div>
          )}
        </div>

        <button type="button" className={styles.btnPrimary} onClick={handleNuevaBusqueda}>
          Hacer otra búsqueda
        </button>
      </div>
    </div>
  );
}
