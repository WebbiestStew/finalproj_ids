import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { usePageTitle } from '../hooks/usePageTitle';
import './NotFound.css';

export default function NotFound() {
  usePageTitle('Página no encontrada');

  return (
    <div className="not-found">
      <Icon name="compass" size={48} className="not-found-icon" />
      <h1>No encontramos esa página</h1>
      <p>La dirección no existe o cambió de lugar.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
