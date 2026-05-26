import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getEstadias } from "../../services/estadias.service";
import { getReservas } from "../../services/reservas.service";
import { getSucursales } from "../../services/sucursales.service";
import { getValoraciones } from "../../services/valoraciones.service";
import { normalizeCollectionPayload } from "../../utils/api";
import styles from "./DashboardPage.module.css";

const SUMMARY_LIMIT = 500;

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-EC", {
  month: "long",
  year: "numeric",
});

const SCORE_FORMATTER = new Intl.NumberFormat("es-EC", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (value, referenceDate) => {
  const date = parseDate(value);
  if (!date) return false;
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
};

const toUpperStatus = (value) => String(value ?? "").trim().toUpperCase();

const getItems = (payload) =>
  normalizeCollectionPayload(payload, { pagina: 1, limite: SUMMARY_LIMIT }).items;

const getActiveGuestCount = (activeStays) =>
  activeStays.reduce((total, stay) => {
    const adults = Number(stay.numAdultos ?? stay.num_adultos);
    const children = Number(stay.numNinos ?? stay.num_ninos);
    const computed = (Number.isFinite(adults) ? adults : 0) + (Number.isFinite(children) ? children : 0);
    return total + (computed > 0 ? computed : 1);
  }, 0);

export default function DashboardPage() {
  useAuth();
  const [summary, setSummary] = useState({
    loading: true,
    warning: null,
    metrics: {
      activeBranches: 0,
      activeBranchesSub: "Cargando sucursales...",
      monthlyReservations: 0,
      monthlyReservationsSub: "Cargando reservas...",
      activeGuests: 0,
      activeGuestsSub: "Cargando estadías...",
      averageRating: null,
      averageRatingSub: "Cargando valoraciones...",
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      const currentDate = new Date();
      const currentMonthLabel =
        MONTH_FORMATTER.format(currentDate).charAt(0).toUpperCase() +
        MONTH_FORMATTER.format(currentDate).slice(1);

      const [sucursalesResult, reservasResult, estadiasResult, valoracionesResult] =
        await Promise.allSettled([
          getSucursales({ pagina: 1, limite: SUMMARY_LIMIT }),
          getReservas({ pagina: 1, limite: SUMMARY_LIMIT }),
          getEstadias({ pagina: 1, limite: SUMMARY_LIMIT }),
          getValoraciones({ pagina: 1, limite: SUMMARY_LIMIT }),
        ]);

      if (cancelled) return;

      const warnings = [];

      const sucursales =
        sucursalesResult.status === "fulfilled"
          ? getItems(sucursalesResult.value)
          : (warnings.push("No se pudieron cargar las sucursales."), []);

      const reservas =
        reservasResult.status === "fulfilled"
          ? getItems(reservasResult.value)
          : (warnings.push("No se pudieron cargar las reservas."), []);

      const estadias =
        estadiasResult.status === "fulfilled"
          ? getItems(estadiasResult.value)
          : (warnings.push("No se pudieron cargar las estadías."), []);

      const valoraciones =
        valoracionesResult.status === "fulfilled"
          ? getItems(valoracionesResult.value)
          : (warnings.push("No se pudieron cargar las valoraciones."), []);

      const activeBranches = sucursales.filter(
        (item) => toUpperStatus(item.estadoSucursal) === "ACT"
      );
      const monthlyReservations = reservas.filter((item) => {
        const status = toUpperStatus(item.estadoReserva);
        return status !== "CAN" && isSameMonth(item.fechaInicio, currentDate);
      });
      const activeStays = estadias.filter(
        (item) => toUpperStatus(item.estadoEstadia) === "ACT"
      );
      const validRatings = valoraciones
        .map((item) => Number(item.puntuacionGeneral))
        .filter((value) => Number.isFinite(value));
      const averageRating =
        validRatings.length > 0
          ? validRatings.reduce((sum, value) => sum + value, 0) / validRatings.length
          : null;

      const activeBranchNames = activeBranches
        .map((item) => item.nombreSucursal)
        .filter(Boolean)
        .slice(0, 2);

      setSummary({
        loading: false,
        warning: warnings[0] ?? null,
        metrics: {
          activeBranches: activeBranches.length,
          activeBranchesSub:
            activeBranches.length === 0
              ? "No hay sucursales activas."
              : activeBranchNames.length > 0
                ? activeBranchNames.join(" / ")
                : `${activeBranches.length} en operación`,
          monthlyReservations: monthlyReservations.length,
          monthlyReservationsSub:
            monthlyReservations.length === 0
              ? `Sin reservas en ${currentMonthLabel}.`
              : `${currentMonthLabel}`,
          activeGuests: getActiveGuestCount(activeStays),
          activeGuestsSub:
            activeStays.length === 0
              ? "Sin estadías activas."
              : `${activeStays.length} estadía(s) activa(s)`,
          averageRating,
          averageRatingSub:
            validRatings.length === 0
              ? "Sin valoraciones registradas."
              : `${validRatings.length} valoración(es) registradas`,
        },
      });
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Sucursales activas",
        value: summary.loading ? "..." : String(summary.metrics.activeBranches),
        sub: summary.metrics.activeBranchesSub,
      },
      {
        label: "Reservas del mes",
        value: summary.loading ? "..." : String(summary.metrics.monthlyReservations),
        sub: summary.metrics.monthlyReservationsSub,
      },
      {
        label: "Huéspedes activos",
        value: summary.loading ? "..." : String(summary.metrics.activeGuests),
        sub: summary.metrics.activeGuestsSub,
      },
      {
        label: "Valoración promedio",
        value:
          summary.loading
            ? "..."
            : summary.metrics.averageRating === null
              ? "--"
              : SCORE_FORMATTER.format(summary.metrics.averageRating),
        sub: summary.metrics.averageRatingSub,
      },
    ],
    [summary]
  );

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
      {summary.warning && <div className={styles.summaryNotice}>{summary.warning}</div>}
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
