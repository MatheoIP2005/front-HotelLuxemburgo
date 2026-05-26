import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, handleLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isSuccess = await handleLogin(username, password);

    if (isSuccess) {
      navigate("/admin");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>Hotel Luxemburgo</h1>
          <p>Panel de Administración</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              autoComplete="off"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
