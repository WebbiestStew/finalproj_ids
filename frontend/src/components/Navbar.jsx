import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import UserMenu from './UserMenu';
import './Navbar.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" aria-label="DAuto, ir al inicio">
            <span className="navbar-brand-d">D</span>Auto
          </Link>
          <nav aria-label="Principal">
            <NavLink to="/catalogo" className="navbar-link">
              Catálogo
            </NavLink>
          </nav>
        </div>

        {user ? (
          <UserMenu />
        ) : (
          <nav className="navbar-actions" aria-label="Cuenta">
            <Link to="/iniciar-sesion" className="btn btn-quiet btn-sm">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="btn btn-primary btn-sm">
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
