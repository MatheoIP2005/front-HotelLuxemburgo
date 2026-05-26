export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ONLY_DIGITS_REGEX = /^\d+$/;
export const ONLY_OPTIONAL_DIGITS_REGEX = /^\d*$/;
export const PERSON_NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
export const COMPANY_NAME_REGEX = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.&'/-]+$/;
export const PASSPORT_REGEX = /^[A-Z0-9]{1,30}$/;
export const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const IDENTIFICATION_TYPES = ["CED", "RUC", "PAS"];
export const IDENTIFICATION_TYPE_OPTIONS = [
  { value: "CED", label: "CED" },
  { value: "RUC", label: "RUC" },
  { value: "PAS", label: "PAS" },
];

export const CLIENT_KINDS = ["NAT", "EMP"];
export const CLIENT_KIND_OPTIONS = [
  { value: "NAT", label: "Persona natural" },
  { value: "EMP", label: "Empresa" },
];

export const SUCURSAL_TIPO_ALOJAMIENTO_OPTIONS = [
  "hotel",
  "hostal",
  "apartamento",
  "resort",
  "villa",
  "cabana",
  "hostel",
];

export const SUCURSAL_CATEGORIA_VIAJE_OPTIONS = [
  "playa",
  "ciudad",
  "montana",
  "aventura",
  "cultural",
  "bienestar",
];

export const CATALOGO_TIPOS = ["AME", "SRV"];
export const CATALOGO_ESTADOS = ["ACT", "INA"];

export const HABITACION_ESTADOS = ["DIS", "OCU", "MNT", "FDS", "INA"];
export const TARIFA_CANALES = ["TODOS", "PORTAL", "ADMIN", "API", "WALKIN"];
export const TARIFA_ESTADOS = ["ACT", "INA"];

export const VALORACION_ESTADOS = ["PEN", "PUB", "OCU", "REP"];
export const VALORACION_MODERATION_STATES = ["PUB", "OCU", "REP"];
export const VALORACION_TIPO_VIAJE_OPTIONS = [
  "pareja",
  "familia",
  "negocios",
  "amigos",
  "solo",
];

export const FACTURA_TIPOS = ["RESERVA", "FINAL", "AJUSTE"];
export const FACTURA_ESTADOS = ["EMI", "PAG", "ANU"];
export const FACTURA_CANALES = ["PORTAL", "ADMIN", "WALKIN"];
export const FACTURA_ITEM_TYPES = ["ALOJAMIENTO", "SERVICIO", "DESCUENTO", "AJUSTE"];
export const FACTURA_REFERENCIA_TYPES = ["RESERVA_HABITACION", "CARGO_ESTADIA"];

export const PAGO_ESTADOS = ["PEN", "PRO", "APR", "REC", "CAN"];
export const PAGO_METODOS = [
  "TARJETA_CREDITO",
  "TARJETA_DEBITO",
  "EFECTIVO",
  "TRANSFERENCIA",
  "CHEQUE",
  "OTRO",
];
export const PAGO_PASARELAS = [
  "STRIPE_SANDBOX",
  "STRIPE_PROD",
  "PAYPAL_SANDBOX",
  "PAYPAL_PROD",
  "OTRO",
];

export const RESERVA_ESTADOS = ["PEN", "CON", "CAN", "EXP", "FIN", "EMI"];
export const RESERVA_CANALES = ["PORTAL", "ADMIN", "WALKIN"];
export const CARGO_ESTADIA_ESTADOS = ["PEN", "FAC", "ANU"];

export const USER_STATES = ["ACT", "INA", "BLO"];
export const ROLE_STATES = ["ACT", "INA"];

export const MAX_LENGTHS = {
  sucursal: {
    codigo: 10,
    nombre: 100,
    descripcion: 250,
    descripcionCorta: 250,
    tipoAlojamiento: 20,
    pais: 15,
    provincia: 30,
    ciudad: 25,
    ubicacion: 200,
    direccion: 250,
    codigoPostal: 20,
    telefono: 9,
    correo: 50,
  },
  catalogo: {
    codigo: 10,
    nombre: 60,
    categoria: 80,
    descripcion: 250,
    iconoUrl: 500,
  },
  cliente: {
    numeroIdentificacion: 30,
    nombres: 50,
    apellidos: 50,
    correo: 100,
    telefono: 10,
    direccion: 200,
  },
  usuario: {
    username: 15,
    nombres: 30,
    apellidos: 30,
    correo: 120,
  },
  rol: {
    nombre: 20,
    descripcion: 250,
    motivo: 150,
  },
  habitacion: {
    numero: 20,
    descripcion: 250,
  },
  imagen: {
    descripcion: 255,
    url: 500,
  },
  cargoEstadia: {
    descripcion: 250,
  },
  factura: {
    motivo: 150,
  },
  reserva: {
    motivoCancelacion: 150,
  },
};

const IDENTIFICATION_TYPE_ALIASES = {
  CED: "CED",
  CEDULA: "CED",
  RUC: "RUC",
  PAS: "PAS",
  PASAPORTE: "PAS",
};

export const normalizeTipoIdentificacion = (value, fallback = "CED") => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return IDENTIFICATION_TYPE_ALIASES[normalized] ?? fallback;
};
