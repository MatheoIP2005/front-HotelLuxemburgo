import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCatalogoServicios from "../../../hooks/useCatalogoServicios";
import styles from "./CatalogoServiciosPage.module.css";

export default function CatalogoServiciosPage() {
  const navigate = useNavigate();
  const { catalogo, loading, error, handleDelete, handleDesactivar } =
    useCatalogoServicios();
  const [actionError, setActionError] = useState(null);

  const onDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;
    setActionError(null);
    try {
      await handleDelete(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo eliminar el registro.");
    }
  };

  const onDesactivar = async (id) => {
    if (!window.confirm("¿Deseas desactivar este servicio?")) return;
    setActionError(null);
    try {
      await handleDesactivar(id);
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo desactivar el registro.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Catálogo de Servicios</h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => navigate("/admin/catalogo-servicios/nuevo")}
        >
          Nuevo Servicio
        </button>
      </div>

      {(error || actionError) && <div className={styles.errorBox}>{actionError || error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Precio Base</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className={styles.loadingMsg}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && catalogo.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyMsg}>
                  No hay registros
                </td>
              </tr>
            )}
            {!loading &&
              catalogo.map((c) => (
                <tr key={c.catalogoGuid}>
                  <td>{c.codigoCatalogo}</td>
                  <td>{c.nombreCatalogo}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        c.tipoCatalogo === "AME" ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      {c.tipoCatalogo}
                    </span>
                  </td>
                  <td>{c.categoriaCatalogo}</td>
                  <td>${c.precioBase}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        c.estadoCatalogo === "ACT"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {c.estadoCatalogo}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() =>
                          navigate(`/admin/catalogo-servicios/${c.catalogoGuid}`)
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => onDelete(c.catalogoGuid)}
                      >
                        Eliminar
                      </button>
                      {c.estadoCatalogo === "ACT" && (
                        <button
                          type="button"
                          className={styles.btnWarning}
                          onClick={() => onDesactivar(c.catalogoGuid)}
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
