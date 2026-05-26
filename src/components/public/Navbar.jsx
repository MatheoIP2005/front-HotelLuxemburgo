import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link to="/buscar" className={styles.logo}>
        <h1>Hotel Luxemburgo</h1>
        <span>Alojamiento</span>
      </Link>

      <div className={styles.links}>
        <Link to="/buscar" className={styles.link}>
          Buscar alojamiento
        </Link>
        <Link to="/admin/login" className={styles.adminBtn}>
          Acceso Admin
        </Link>
      </div>
    </nav>
  );
}
