import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import FormAlert from '../components/FormAlert';
import { useAuth } from '../context/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Login() {
  usePageTitle('Iniciar sesión');
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
      navigate(location.state?.from || '/panel', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      icon="lock"
      title="Iniciar sesión"
      subtitle="Entra a tu cuenta de DAuto."
      footer={
        <>
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </>
      }
    >
      <FormAlert message={formError} />

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
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
          <label htmlFor="password">Contraseña</label>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthLayout>
  );
}
