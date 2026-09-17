import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">D</span>
          DAuto
        </Link>

        {user ? (
          <div className="navbar-actions">
            <span className="navbar-user">Hola, {user.name.split(' ')[0]}</span>
            <Link to="/panel" className="btn btn-secondary btn-sm">
              Mi panel
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
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
