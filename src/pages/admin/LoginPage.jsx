import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { cambiarPasswordDesdeLogin } from "../../services/auth.service";
import hotelLoginImage from "../../../imagenes/HotelLuxemburgo.png";
import styles from "./LoginPage.module.css";

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.53 2.47a.75.75 0 1 0-1.06 1.06l2.3 2.3C2.97 7.1 1.71 8.96 1.2 9.8a1.75 1.75 0 0 0 0 1.82C2.31 13.45 5.64 18 12 18c2.23 0 4.2-.56 5.92-1.44l2.55 2.55a.75.75 0 1 0 1.06-1.06Zm7.17 7.17 3.66 3.66A3 3 0 0 1 10.7 9.64Zm5.15 5.15-1.53-1.53A3.75 3.75 0 0 0 9.74 8.68L8.28 7.22A9.85 9.85 0 0 1 12 6c6.36 0 9.69 4.55 10.8 6.38a1.75 1.75 0 0 1 0 1.82 14.89 14.89 0 0 1-2.24 2.88l-1.07-1.07A13.46 13.46 0 0 0 21.51 13c-.97-1.44-3.72-5.5-9.51-5.5-.95 0-1.84.11-2.67.31l-1.2-1.2A10.85 10.85 0 0 1 12 4.5c6.36 0 9.69 4.55 10.8 6.38a1.75 1.75 0 0 1 0 1.82 15 15 0 0 1-2.15 2.79l-4.8-4.8Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.25c6.56 0 10 5.85 10.9 7.55.13.24.13.51 0 .75C22 15.15 18.56 21 12 21S2 15.15 1.1 13.45a.84.84 0 0 1 0-.75C2 11.1 5.44 5.25 12 5.25Zm0 1.5c-5.42 0-8.39 4.82-9.27 6.38.88 1.56 3.85 6.37 9.27 6.37s8.39-4.81 9.27-6.37c-.88-1.56-3.85-6.38-9.27-6.38Zm0 2.25a4.13 4.13 0 1 1 0 8.25 4.13 4.13 0 0 1 0-8.25Zm0 1.5a2.63 2.63 0 1 0 0 5.25 2.63 2.63 0 0 0 0-5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
  visible,
  onToggle,
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordControl}>
        <input
          id={id}
          className={styles.passwordInput}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onToggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, handleLogin } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isChangeMode = mode === "changePassword";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  const resetChangePasswordState = () => {
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError(null);
    setShowPrimaryPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSuccessMessage(null);
    resetChangePasswordState();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage(null);

    if (!isChangeMode) {
      const isSuccess = await handleLogin(username.trim(), password);

      if (isSuccess) {
        navigate("/admin");
      }
      return;
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setChangePasswordError("El usuario es obligatorio.");
      return;
    }

    if (!password.trim()) {
      setChangePasswordError("La contraseña actual es obligatoria.");
      return;
    }

    if (!newPassword.trim()) {
      setChangePasswordError("La nueva contraseña es obligatoria.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError("La confirmación de contraseña no coincide.");
      return;
    }

    if (newPassword.length > 200) {
      setChangePasswordError("La nueva contraseña no puede exceder 200 caracteres.");
      return;
    }

    if (password === newPassword) {
      setChangePasswordError("La nueva contraseña debe ser diferente de la actual.");
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError(null);

    try {
      await cambiarPasswordDesdeLogin({
        username: normalizedUsername,
        passwordActual: password,
        passwordNuevo: newPassword,
      });

      setMode("login");
      setSuccessMessage("Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.");
      resetChangePasswordState();
    } catch (err) {
      setChangePasswordError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo cambiar la contraseña."
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.loginPanel}>
          <div className={styles.brandBlock}>
            <span className={styles.eyebrow}>Administración</span>
            <h1>Hotel Luxemburgo</h1>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h2>{isChangeMode ? "Cambiar contraseña" : "Acceso al panel"}</h2>
              <p>
                {isChangeMode
                  ? "Valida tus credenciales actuales y registra una nueva contraseña."
                  : "Ingresa con tu cuenta administrativa para continuar."}
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <PasswordField
              id="password"
              label={isChangeMode ? "Contraseña actual" : "Contraseña"}
              autoComplete="current-password"
              placeholder={
                isChangeMode ? "Ingresa tu contraseña actual" : "Ingresa tu contraseña"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              visible={showPrimaryPassword}
              onToggle={() => setShowPrimaryPassword((prev) => !prev)}
            />

            {isChangeMode && (
              <>
                <PasswordField
                  id="newPassword"
                  label="Nueva contraseña"
                  autoComplete="new-password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((prev) => !prev)}
                />

                <PasswordField
                  id="confirmPassword"
                  label="Confirmar nueva contraseña"
                  autoComplete="new-password"
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                />

                <p className={styles.helperText}>
                  La nueva contraseña debe ser distinta de la actual y coincidir con la confirmación.
                </p>
              </>
            )}

            {!isChangeMode && successMessage && (
              <div className={styles.successBox}>{successMessage}</div>
            )}

            {!isChangeMode && !successMessage && error && (
              <div className={styles.errorBox}>{error}</div>
            )}
            {isChangeMode && changePasswordError && (
              <div className={styles.errorBox}>{changePasswordError}</div>
            )}

            {isChangeMode ? (
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => switchMode("login")}
                  disabled={changePasswordLoading}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </div>
            ) : (
              <>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
                <button
                  type="button"
                  className={styles.textAction}
                  onClick={() => switchMode("changePassword")}
                  disabled={loading}
                >
                  Cambiar contraseña
                </button>
              </>
            )}
          </form>
        </section>

        <aside className={styles.visualPanel}>
          <div className={styles.visualOverlay}>
            <div className={styles.visualBadge}>Hotel Luxemburgo</div>
            <h2>{isChangeMode ? "Seguridad de Acceso" : "Panel de Administración"}</h2>
            <p>
              {isChangeMode
                ? "Actualiza tus credenciales desde una misma experiencia visual, sin salir de la pantalla de ingreso."
                : "Mantén el control operativo del hotel con una experiencia más clara, moderna y alineada a la identidad de la marca."}
            </p>
          </div>
          <img
            className={styles.visualImage}
            src={hotelLoginImage}
            alt="Identidad visual de Hotel Luxemburgo"
          />
        </aside>
      </div>
    </div>
  );
}
