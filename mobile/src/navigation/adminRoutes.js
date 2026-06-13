import { getAllAdminModules } from "../config/adminModules";
import AdminReservasScreen from "../screens/AdminReservasScreen";
import AdminSucursalesScreen from "../screens/admin/AdminSucursalesScreen";
import AdminTiposHabitacionScreen from "../screens/admin/AdminTiposHabitacionScreen";
import AdminHabitacionesScreen from "../screens/admin/AdminHabitacionesScreen";
import AdminTarifasScreen from "../screens/admin/AdminTarifasScreen";
import AdminCatalogoServiciosScreen from "../screens/admin/AdminCatalogoServiciosScreen";
import AdminClientesScreen from "../screens/admin/AdminClientesScreen";
import AdminEstadiasScreen from "../screens/admin/AdminEstadiasScreen";
import AdminValoracionesScreen from "../screens/admin/AdminValoracionesScreen";
import AdminFacturasScreen from "../screens/admin/AdminFacturasScreen";
import AdminPagosScreen from "../screens/admin/AdminPagosScreen";
import AdminUsuariosScreen from "../screens/admin/AdminUsuariosScreen";
import AdminRolesScreen from "../screens/admin/AdminRolesScreen";
import AdminCambiarPasswordScreen from "../screens/admin/AdminCambiarPasswordScreen";
import AdminAuditoriaScreen from "../screens/admin/AdminAuditoriaScreen";

const IMPLEMENTED_SCREENS = {
  AdminSucursales: AdminSucursalesScreen,
  AdminTiposHabitacion: AdminTiposHabitacionScreen,
  AdminHabitaciones: AdminHabitacionesScreen,
  AdminTarifas: AdminTarifasScreen,
  AdminCatalogoServicios: AdminCatalogoServiciosScreen,
  AdminClientes: AdminClientesScreen,
  AdminReservas: AdminReservasScreen,
  AdminEstadias: AdminEstadiasScreen,
  AdminValoraciones: AdminValoracionesScreen,
  AdminFacturas: AdminFacturasScreen,
  AdminPagos: AdminPagosScreen,
  AdminUsuarios: AdminUsuariosScreen,
  AdminRoles: AdminRolesScreen,
  AdminCambiarPassword: AdminCambiarPasswordScreen,
  AdminAuditoria: AdminAuditoriaScreen,
};

export const getAdminStackScreens = () =>
  getAllAdminModules().map((module) => {
    const component = IMPLEMENTED_SCREENS[module.route];
    if (!component) {
      throw new Error(`Pantalla admin no registrada: ${module.route}`);
    }

    return {
      name: module.route,
      component,
      options: { title: module.title },
    };
  });
