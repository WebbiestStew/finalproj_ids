import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from || '/panel');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesion para gestionar tu cuenta en DAuto."
      footer={
        <>
          No tienes cuenta? <Link to="/registro">Registrate</Link>
        </>
      }
    >
      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Correo electronico</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contrasena"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <span className="spinner" />}
          {submitting ? 'Ingresando...' : 'Iniciar sesion'}
        </button>
      </form>
    </AuthLayout>
  );
}
