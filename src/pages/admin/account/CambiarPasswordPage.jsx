import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cambiarPassword } from "../../../services/auth.service";
import styles from "../usuarios/UsuarioFormPage.module.css";

const EMPTY_FORM = {
  password_actual: "",
  password_nuevo: "",
  confirmar_password: "",
};

export default function CambiarPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!form.password_actual.trim()) {
        throw new Error("La contraseña actual es obligatoria.");
      }
      if (!form.password_nuevo.trim()) {
        throw new Error("La nueva contraseña es obligatoria.");
      }
      if (form.password_nuevo !== form.confirmar_password) {
        throw new Error("La confirmación de contraseña no coincide.");
      }
      if (form.password_nuevo.length > 200) {
        throw new Error("La nueva contraseña no puede exceder 200 caracteres.");
      }

      await cambiarPassword({
        passwordActual: form.password_actual,
        passwordNuevo: form.password_nuevo,
      });

      setSuccess("Contraseña actualizada correctamente.");
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div className={styles.topBar}>
        <h2>Cambiar Password</h2>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin")}>
          Volver
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Credenciales</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Contraseña actual</label>
            <input
              type="password"
              name="password_actual"
              value={form.password_actual}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Nueva contraseña</label>
            <input
              type="password"
              name="password_nuevo"
              value={form.password_nuevo}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>
          <div className={styles.fieldFull}>
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              name="confirmar_password"
              value={form.confirmar_password}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate("/admin")}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Guardando..." : "Actualizar password"}
        </button>
      </div>
    </form>
  );
}
