import { createContext, useContext, useMemo, useState } from "react";

const initialBookingData = {
  propiedad: null,
  habitacion: null,
  fechaEntrada: "",
  fechaSalida: "",
  numAdultos: 1,
  numHabitaciones: 1,
  numNinos: 0,
  precioTotal: 0,
  cliente: null,
  publicReservation: null,
};

const BookingContext = createContext(undefined);

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState(initialBookingData);

  const value = useMemo(
    () => ({
      bookingData,
      setPropiedad: (propiedad) =>
        setBookingData((prev) => ({ ...prev, propiedad })),
      setHabitacion: (habitacion) =>
        setBookingData((prev) => ({ ...prev, habitacion })),
      setFechas: (fechaEntrada, fechaSalida) =>
        setBookingData((prev) => ({ ...prev, fechaEntrada, fechaSalida })),
      setHuespedes: (numAdultos, numHabitaciones, numNinos) =>
        setBookingData((prev) => ({
          ...prev,
          numAdultos,
          numHabitaciones,
          numNinos,
        })),
      setPrecioTotal: (precioTotal) =>
        setBookingData((prev) => ({ ...prev, precioTotal })),
      setCliente: (cliente) =>
        setBookingData((prev) => ({ ...prev, cliente })),
      setPublicReservation: (publicReservation) =>
        setBookingData((prev) => ({ ...prev, publicReservation })),
      resetBooking: () => setBookingData(initialBookingData),
    }),
    [bookingData]
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error("useBooking debe usarse dentro de BookingProvider");
  }

  return context;
};
