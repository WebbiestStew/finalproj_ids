import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import './Navbar.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">D</span>
          DAuto
        </Link>

        {user ? (
          <UserMenu />
        ) : (
          <div className="navbar-actions">
            <Link to="/iniciar-sesion" className="btn btn-ghost btn-sm">
              Iniciar sesion
            </Link>
            <Link to="/registro" className="btn btn-primary btn-sm">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
