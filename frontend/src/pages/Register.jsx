import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Ingresa un nombre valido';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Ingresa un correo valido';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Minimo ${MIN_PASSWORD_LENGTH} caracteres`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate('/panel');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta en DAuto"
      subtitle="Elige el tipo de cuenta que necesitas para empezar."
      footer={
        <>
          Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesion</Link>
        </>
      }
    >
      <div className="segmented" role="tablist" aria-label="Tipo de cuenta">
        <button
          type="button"
          className={role === 'comprador' ? 'active' : ''}
          onClick={() => setRole('comprador')}
        >
          Soy comprador
        </button>
        <button
          type="button"
          className={role === 'concesionaria' ? 'active' : ''}
          onClick={() => setRole('concesionaria')}
        >
          Soy concesionaria
        </button>
      </div>

      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">{role === 'concesionaria' ? 'Nombre de la concesionaria' : 'Nombre completo'}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'has-error' : ''}
            placeholder={role === 'concesionaria' ? 'Autos del Norte' : 'Ana Garcia'}
            autoComplete="name"
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Correo electronico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'has-error' : ''}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'has-error' : ''}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <span className="spinner" />}
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
