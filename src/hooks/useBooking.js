import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';

const useBooking = () => {
  const context = useContext(BookingContext);

  if (context === undefined) {
    throw new Error('useBooking debe usarse dentro de un BookingProvider');
  }

  return context;
};

export default useBooking;
