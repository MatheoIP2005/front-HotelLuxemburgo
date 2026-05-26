import { createContext, useState } from 'react';

const initialBookingData = {
  propiedad: null,
  habitacion: null,
  fechaEntrada: '',
  fechaSalida: '',
  numAdultos: 1,
  numHabitaciones: 1,
  numNinos: 0,
  precioTotal: 0,
  cliente: null,
  publicReservation: null,
  simulatedPayment: null,
};

export const BookingContext = createContext(undefined);

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState(initialBookingData);

  const setPropiedad = (propiedad) => {
    setBookingData((prev) => ({ ...prev, propiedad }));
  };

  const setHabitacion = (habitacion) => {
    setBookingData((prev) => ({ ...prev, habitacion }));
  };

  const setFechas = (entrada, salida) => {
    setBookingData((prev) => ({
      ...prev,
      fechaEntrada: entrada,
      fechaSalida: salida,
    }));
  };

  const setHuespedes = (adultos, habitaciones, ninos) => {
    setBookingData((prev) => ({
      ...prev,
      numAdultos: adultos,
      numHabitaciones: habitaciones,
      numNinos: ninos,
    }));
  };

  const setPrecioTotal = (precio) => {
    setBookingData((prev) => ({ ...prev, precioTotal: precio }));
  };

  const setCliente = (cliente) => {
    setBookingData((prev) => ({ ...prev, cliente }));
  };

  const setPublicReservation = (publicReservation) => {
    setBookingData((prev) => ({ ...prev, publicReservation }));
  };

  const setSimulatedPayment = (simulatedPayment) => {
    setBookingData((prev) => ({ ...prev, simulatedPayment }));
  };

  const resetBooking = () => {
    setBookingData(initialBookingData);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        setPropiedad,
        setHabitacion,
        setFechas,
        setHuespedes,
        setPrecioTotal,
        setCliente,
        setPublicReservation,
        setSimulatedPayment,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
