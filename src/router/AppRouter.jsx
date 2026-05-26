import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { BookingProvider } from "../context/BookingContext";
import AdminRoutes from "./AdminRoutes";
import LoginPage from "../pages/admin/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import SucursalesPage from "../pages/admin/sucursales/SucursalesPage";
import SucursalFormPage from "../pages/admin/sucursales/SucursalFormPage";
import TiposHabitacionPage from "../pages/admin/tiposHabitacion/TiposHabitacionPage";
import TipoHabitacionFormPage from "../pages/admin/tiposHabitacion/TipoHabitacionFormPage";
import HabitacionesPage from "../pages/admin/habitaciones/HabitacionesPage";
import HabitacionFormPage from "../pages/admin/habitaciones/HabitacionFormPage";
import TarifasPage from "../pages/admin/tarifas/TarifasPage";
import TarifaFormPage from "../pages/admin/tarifas/TarifaFormPage";
import CatalogoServiciosPage from "../pages/admin/catalogoServicios/CatalogoServiciosPage";
import CatalogoServicioFormPage from "../pages/admin/catalogoServicios/CatalogoServicioFormPage";
import ClientesPage from "../pages/admin/clientes/ClientesPage";
import ClienteFormPage from "../pages/admin/clientes/ClienteFormPage";
import ReservasPage from "../pages/admin/reservas/ReservasPage";
import ReservaFormPage from "../pages/admin/reservas/ReservaFormPage";
import ReservaDetallePage from "../pages/admin/reservas/ReservaDetallePage";
import EstadiasPage from "../pages/admin/estadias/EstadiasPage";
import FacturasPage from "../pages/admin/facturas/FacturasPage";
import PagosPage from "../pages/admin/pagos/PagosPage";
import PagoFormPage from "../pages/admin/pagos/PagoFormPage";
import ValoracionesPage from "../pages/admin/valoraciones/ValoracionesPage";
import UsuariosPage from "../pages/admin/usuarios/UsuariosPage";
import UsuarioFormPage from "../pages/admin/usuarios/UsuarioFormPage";
import AuditoriaPage from "../pages/admin/auditoria/AuditoriaPage";
import RolesPage from "../pages/admin/roles/RolesPage";
import RolFormPage from "../pages/admin/roles/RolFormPage";
import CambiarPasswordPage from "../pages/admin/account/CambiarPasswordPage";
import AdminLayout from "../components/admin/layout/AdminLayout";
import SearchPage from "../pages/public/SearchPage";
import AccommodationDetailPage from "../pages/public/AccommodationDetailPage";
import BookingFormPage from "../pages/public/BookingFormPage";
import PaymentPage from "../pages/public/PaymentPage";
import ConfirmationPage from "../pages/public/ConfirmationPage";
import NotFoundPage from "../pages/NotFoundPage";

function ProtectedLayout() {
  return (
    <AdminRoutes>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminRoutes>
  );
}

function PublicLayout() {
  return (
    <BookingProvider>
      <Outlet />
    </BookingProvider>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/buscar/:id" element={<AccommodationDetailPage />} />
            <Route path="/reservar" element={<BookingFormPage />} />
            <Route path="/pago" element={<PaymentPage />} />
            <Route path="/confirmacion" element={<ConfirmationPage />} />
          </Route>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="sucursales" element={<SucursalesPage />} />
            <Route path="sucursales/nueva" element={<SucursalFormPage />} />
            <Route path="sucursales/:id" element={<SucursalFormPage />} />
            <Route path="tipos-habitacion" element={<TiposHabitacionPage />} />
            <Route
              path="tipos-habitacion/nuevo"
              element={<TipoHabitacionFormPage />}
            />
            <Route
              path="tipos-habitacion/:id"
              element={<TipoHabitacionFormPage />}
            />
            <Route path="habitaciones" element={<HabitacionesPage />} />
            <Route path="habitaciones/nueva" element={<HabitacionFormPage />} />
            <Route path="habitaciones/:id" element={<HabitacionFormPage />} />
            <Route path="tarifas" element={<TarifasPage />} />
            <Route path="tarifas/nueva" element={<TarifaFormPage />} />
            <Route path="tarifas/:id" element={<TarifaFormPage />} />
            <Route
              path="catalogo-servicios"
              element={<CatalogoServiciosPage />}
            />
            <Route
              path="catalogo-servicios/nuevo"
              element={<CatalogoServicioFormPage />}
            />
            <Route
              path="catalogo-servicios/:id"
              element={<CatalogoServicioFormPage />}
            />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="clientes/:id" element={<ClienteFormPage />} />
            <Route path="reservas" element={<ReservasPage />} />
            <Route path="reservas/nueva" element={<ReservaFormPage />} />
            <Route path="reservas/:id" element={<ReservaDetallePage />} />
            <Route path="estadias" element={<EstadiasPage />} />
            <Route path="facturas" element={<FacturasPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="pagos/nuevo" element={<PagoFormPage />} />
            <Route path="valoraciones" element={<ValoracionesPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="usuarios/nuevo" element={<UsuarioFormPage />} />
            <Route path="usuarios/:id" element={<UsuarioFormPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="roles/nuevo" element={<RolFormPage />} />
            <Route path="roles/:id" element={<RolFormPage />} />
            <Route path="cambiar-password" element={<CambiarPasswordPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/buscar" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
