import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  useAuth();

  const stats = [
    { label: "Sucursales activas", value: "1", sub: "Hotel Luxemburgo" },
    { label: "Reservas del mes", value: "--", sub: "Conectar con API" },
    { label: "Huéspedes activos", value: "--", sub: "Conectar con API" },
    { label: "Valoración promedio", value: "--", sub: "Conectar con API" },
  ];

  const modules = [
    { icon: "🏨", name: "Sucursales", path: "/admin/sucursales" },
    { icon: "🛏️", name: "Habitaciones", path: "/admin/habitaciones" },
    { icon: "🧩", name: "Tipos Habitación", path: "/admin/tipos-habitacion" },
    { icon: "💲", name: "Tarifas", path: "/admin/tarifas" },
    {
      icon: "🧾",
      name: "Catálogo Servicios",
      path: "/admin/catalogo-servicios",
    },
    { icon: "👥", name: "Clientes", path: "/admin/clientes" },
    { icon: "📅", name: "Reservas", path: "/admin/reservas" },
    { icon: "🧳", name: "Estadías", path: "/admin/estadias" },
    { icon: "🧾", name: "Facturas", path: "/admin/facturas" },
    { icon: "💳", name: "Pagos", path: "/admin/pagos" },
    { icon: "⭐", name: "Valoraciones", path: "/admin/valoraciones" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.welcome}>
        <h2>Bienvenido al Panel de Administración</h2>
        <p>Gestiona todos los módulos del Hotel Luxemburgo desde aquí.</p>
      </div>

      <p className={styles.sectionTitle}>Resumen general</p>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div className={styles.statCard} key={stat.label}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statSub}>{stat.sub}</span>
          </div>
        ))}
      </div>

      <p className={styles.sectionTitle}>Módulos del sistema</p>
      <div className={styles.modulesGrid}>
        {modules.map((module) => (
          <Link key={module.path} to={module.path} className={styles.moduleCard}>
            <span className={styles.moduleIcon}>{module.icon}</span>
            <span className={styles.moduleName}>{module.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
