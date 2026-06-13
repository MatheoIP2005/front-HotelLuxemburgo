import publicApi from "../api/publicApi";
import { createPublicReservasService } from "../shared/services/publicReservas.service";

const publicReservasService = createPublicReservasService(publicApi);

export const { createPublicReserva } = publicReservasService;
