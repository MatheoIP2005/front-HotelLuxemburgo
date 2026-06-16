export const ADMIN_MODULE_GROUPS = [
  {
    key: "alojamiento",
    title: "Alojamiento",
    modules: [
      { key: "sucursales", title: "Sucursales", route: "AdminSucursales", implemented: true },
      {
        key: "tipos-habitacion",
        title: "Tipos de habitación",
        route: "AdminTiposHabitacion",
        implemented: true,
      },
      { key: "habitaciones", title: "Habitaciones", route: "AdminHabitaciones", implemented: true },
      { key: "tarifas", title: "Tarifas", route: "AdminTarifas", implemented: true },
      {
        key: "catalogo-servicios",
        title: "Catálogo de servicios",
        route: "AdminCatalogoServicios",
        implemented: true,
      },
    ],
  },
  {
    key: "reservas",
    title: "Reservas y clientes",
    modules: [
      { key: "clientes", title: "Clientes", route: "AdminClientes", implemented: true },
      { key: "reservas", title: "Reservas", route: "AdminReservas", implemented: true },
      { key: "estadias", title: "Estadías", route: "AdminEstadias", implemented: true },
    ],
  },
  {
    key: "finanzas",
    title: "Finanzas",
    modules: [
      { key: "facturas", title: "Facturas", route: "AdminFacturas", implemented: true },
      { key: "pagos", title: "Pagos", route: "AdminPagos", implemented: true },
    ],
  },
  {
    key: "operacion",
    title: "Operación",
    modules: [
      { key: "valoraciones", title: "Valoraciones", route: "AdminValoraciones", implemented: true },
    ],
  },
  {
    key: "seguridad",
    title: "Seguridad",
    modules: [],
  },
];

export const getAllAdminModules = () =>
  ADMIN_MODULE_GROUPS.flatMap((group) => group.modules);
