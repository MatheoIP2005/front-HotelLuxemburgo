import { createAccommodationsService } from "../../../src/shared/services/accommodations.service";
import { createPublicReservasService } from "../../../src/shared/services/publicReservas.service";
import publicApi from "../api/publicApi";

export const {
  searchAccommodations,
  getAccommodation,
  getCategories,
  getReviews,
} = createAccommodationsService(publicApi);

export const { createPublicReserva } = createPublicReservasService(publicApi);
