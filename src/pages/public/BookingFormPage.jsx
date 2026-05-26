import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBooking from '../../hooks/useBooking';
import Navbar from '../../components/public/Navbar';
import {
  EMAIL_REGEX,
  IDENTIFICATION_TYPE_OPTIONS,
  MAX_LENGTHS,
  ONLY_OPTIONAL_DIGITS_REGEX,
  PASSPORT_REGEX,
  PERSON_NAME_REGEX,
  normalizeTipoIdentificacion,
} from '../../utils/constraints';
import styles from './BookingFormPage.module.css';

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { bookingData, setCliente } = useBooking();

  useEffect(() => {
    if (!bookingData.habitacion) {
      navigate('/buscar');
    }
  }, [bookingData.habitacion, navigate]);

  const [form, setForm] = useState({
    tipo_identificacion: 'CED',
    numero_identificacion: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo_identificacion') {
      setForm((prev) => ({
        ...prev,
        tipo_identificacion: normalizeTipoIdentificacion(value),
        numero_identificacion: '',
      }));
      return;
    }

    if (name === 'telefono' && !ONLY_OPTIONAL_DIGITS_REGEX.test(value)) {
      return;
    }

    if (name === 'numero_identificacion') {
      if (normalizeTipoIdentificacion(form.tipo_identificacion) === 'PAS') {
        const upperValue = value.toUpperCase();
        if (upperValue && !PASSPORT_REGEX.test(upperValue)) return;
        setForm((prev) => ({ ...prev, numero_identificacion: upperValue }));
        return;
      }

      if (!ONLY_OPTIONAL_DIGITS_REGEX.test(value)) {
        return;
      }
    }

    if ((name === 'nombres' || name === 'apellidos') && value && !PERSON_NAME_REGEX.test(value)) {
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tipoIdentificacion = normalizeTipoIdentificacion(form.tipo_identificacion);
    const numeroIdentificacion = form.numero_identificacion.trim();
    const nombres = form.nombres.trim();
    const apellidos = form.apellidos.trim();
    const correo = form.correo.trim();
    const telefono = form.telefono.trim();
    const direccion = form.direccion.trim();

    if (
      !numeroIdentificacion ||
      !nombres ||
      !apellidos ||
      !correo ||
      !telefono ||
      !direccion
    ) {
      setError('Completa todos los campos para continuar.');
      return;
    }

    if (tipoIdentificacion === 'CED' && !/^\d{10}$/.test(numeroIdentificacion)) {
      setError('La cédula debe tener exactamente 10 números.');
      return;
    }

    if (tipoIdentificacion === 'RUC' && !/^\d{13}$/.test(numeroIdentificacion)) {
      setError('El RUC debe tener exactamente 13 números.');
      return;
    }

    if (tipoIdentificacion === 'PAS' && !PASSPORT_REGEX.test(numeroIdentificacion)) {
      setError('El pasaporte solo puede contener letras y números.');
      return;
    }

    if (nombres.length > MAX_LENGTHS.cliente.nombres || apellidos.length > MAX_LENGTHS.cliente.apellidos) {
      setError('Nombres y apellidos no pueden exceder 50 caracteres.');
      return;
    }

    if (!PERSON_NAME_REGEX.test(nombres) || !PERSON_NAME_REGEX.test(apellidos)) {
      setError('Nombres y apellidos solo pueden contener letras.');
      return;
    }

    if (correo.length > MAX_LENGTHS.cliente.correo || !EMAIL_REGEX.test(correo)) {
      setError('Ingresa un correo válido de hasta 100 caracteres.');
      return;
    }

    if (!/^\d{10}$/.test(telefono)) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }

    if (direccion.length > MAX_LENGTHS.cliente.direccion) {
      setError('La dirección no puede exceder 200 caracteres.');
      return;
    }

    setError(null);
    setCliente({
      ...form,
      tipo_identificacion: tipoIdentificacion,
      numero_identificacion:
        tipoIdentificacion === 'PAS' ? numeroIdentificacion.toUpperCase() : numeroIdentificacion,
      nombres,
      apellidos,
      correo,
      telefono,
      direccion,
    });
    navigate('/pago');
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/buscar')}>
          ← Volver
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.summaryBox}>
          <h3>Resumen de tu reserva</h3>
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
            <span>Precio total</span>
            <span>{bookingData.precioTotal || 0}</span>
          </div>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <h3 className={styles.cardTitle}>Tus datos personales</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="tipo_identificacion">Tipo de identificación</label>
              <select
                id="tipo_identificacion"
                name="tipo_identificacion"
                value={form.tipo_identificacion}
                onChange={handleChange}
              >
                {IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="numero_identificacion">Número de identificación</label>
              <input
                id="numero_identificacion"
                name="numero_identificacion"
                maxLength={30}
                value={form.numero_identificacion}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" name="nombres" maxLength={50} value={form.nombres} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="apellidos">Apellidos</label>
              <input
                id="apellidos"
                name="apellidos"
                maxLength={50}
                value={form.apellidos}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="correo">Correo</label>
              <input
                id="correo"
                name="correo"
                type="email"
                maxLength={100}
                value={form.correo}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                inputMode="numeric"
                maxLength={10}
                value={form.telefono}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldFull}>
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                name="direccion"
                maxLength={200}
                value={form.direccion}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/buscar')}
            >
              Volver
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Continuar al pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
