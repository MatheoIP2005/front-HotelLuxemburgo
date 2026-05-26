import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const { user, handleLogout } = useAuth();
  const { pathname } = useLocation();
  const displayUser =
    typeof user === "string"
      ? user
      : user?.username || user?.correo || "Usuario";

  const pageTitles = {
    "/admin": "Dashboard",
    "/admin/sucursales": "Sucursales",
    "/admin/habitaciones": "Habitaciones",
    "/admin/tipos-habitacion": "Tipos de Habitación",
    "/admin/tarifas": "Tarifas",
    "/admin/catalogo-servicios": "Catálogo de Servicios",
    "/admin/clientes": "Clientes",
    "/admin/reservas": "Reservas",
    "/admin/estadias": "Estadías",
    "/admin/facturas": "Facturas",
    "/admin/pagos": "Pagos",
    "/admin/valoraciones": "Valoraciones",
    "/admin/usuarios": "Usuarios",
    "/admin/roles": "Roles",
    "/admin/cambiar-password": "Cambiar Password",
    "/admin/auditoria": "Auditoría",
  };

  const getNavItemClassName = ({ isActive }) =>
    `${styles.navItem} ${isActive ? styles.navItemActive : ""}`.trim();

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <h2>Hotel Luxemburgo</h2>
          <span>Panel Admin</span>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/admin" end className={getNavItemClassName}>
            <span className={styles.navIcon}>📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/sucursales" className={getNavItemClassName}>
            <span className={styles.navIcon}>🏨</span>
            <span>Sucursales</span>
          </NavLink>
          <NavLink to="/admin/habitaciones" className={getNavItemClassName}>
            <span className={styles.navIcon}>🛏️</span>
            <span>Habitaciones</span>
          </NavLink>
          <NavLink
            to="/admin/tipos-habitacion"
            className={getNavItemClassName}
          >
            <span className={styles.navIcon}>🧩</span>
            <span>Tipos de Habitación</span>
          </NavLink>
          <NavLink to="/admin/tarifas" className={getNavItemClassName}>
            <span className={styles.navIcon}>💲</span>
            <span>Tarifas</span>
          </NavLink>
          <NavLink
            to="/admin/catalogo-servicios"
            className={getNavItemClassName}
          >
            <span className={styles.navIcon}>🧾</span>
            <span>Catálogo Servicios</span>
          </NavLink>
          <NavLink to="/admin/clientes" className={getNavItemClassName}>
            <span className={styles.navIcon}>👥</span>
            <span>Clientes</span>
          </NavLink>
          <NavLink to="/admin/reservas" className={getNavItemClassName}>
            <span className={styles.navIcon}>📅</span>
            <span>Reservas</span>
          </NavLink>
          <NavLink to="/admin/estadias" className={getNavItemClassName}>
            <span className={styles.navIcon}>🧳</span>
            <span>Estadías</span>
          </NavLink>
          <NavLink to="/admin/facturas" className={getNavItemClassName}>
            <span className={styles.navIcon}>🧾</span>
            <span>Facturas</span>
          </NavLink>
          <NavLink to="/admin/pagos" className={getNavItemClassName}>
            <span className={styles.navIcon}>💳</span>
            <span>Pagos</span>
          </NavLink>
          <NavLink to="/admin/valoraciones" className={getNavItemClassName}>
            <span className={styles.navIcon}>⭐</span>
            <span>Valoraciones</span>
          </NavLink>
          <NavLink to="/admin/usuarios" className={getNavItemClassName}>
            <span className={styles.navIcon}>👤</span>
            <span>Usuarios</span>
          </NavLink>
          <NavLink to="/admin/roles" className={getNavItemClassName}>
            <span className={styles.navIcon}>🪪</span>
            <span>Roles</span>
          </NavLink>
          <NavLink to="/admin/cambiar-password" className={getNavItemClassName}>
            <span className={styles.navIcon}>🔐</span>
            <span>Cambiar Password</span>
          </NavLink>
          <NavLink to="/admin/auditoria" className={getNavItemClassName}>
            <span className={styles.navIcon}>🛡️</span>
            <span>Auditoría</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.navIcon}>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>
            {pageTitles[pathname] || "Panel Admin"}
          </h1>
          <span className={styles.headerUser}>{displayUser}</span>
        </header>
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}
