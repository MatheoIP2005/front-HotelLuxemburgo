import publicApi from "../api/publicApi";
import { createAccommodationsService } from "../shared/services/accommodations.service";

const accommodationsService = createAccommodationsService(publicApi);

export const {
  searchAccommodations,
  getAccommodation,
  getCategories,
  getReviews,
} = accommodationsService;
