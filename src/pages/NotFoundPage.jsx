import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.code}>404</div>
        <h2 className={styles.title}>Página no encontrada</h2>
        <p className={styles.desc}>La página que buscas no existe o fue movida</p>
        <Link to="/buscar" className={styles.btn}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
