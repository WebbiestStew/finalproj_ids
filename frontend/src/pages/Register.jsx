import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import FormAlert from '../components/FormAlert';
import { useAuth } from '../context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const highlightTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', bounce: 0, duration: 0.3 };

  const [role, setRole] = useState('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
          role="tab"
          aria-selected={role === 'comprador'}
          className={role === 'comprador' ? 'active' : ''}
          onClick={() => setRole('comprador')}
        >
          {role === 'comprador' && (
            <motion.span
              layoutId="segmentedHighlight"
              className="segmented-highlight"
              transition={highlightTransition}
            />
          )}
          <span className="segmented-label">Soy comprador</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'concesionaria'}
          className={role === 'concesionaria' ? 'active' : ''}
          onClick={() => setRole('concesionaria')}
        >
          {role === 'concesionaria' && (
            <motion.span
              layoutId="segmentedHighlight"
              className="segmented-highlight"
              transition={highlightTransition}
            />
          )}
          <span className="segmented-label">Soy concesionaria</span>
        </button>
      </div>

      <FormAlert message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">{role === 'concesionaria' ? 'Nombre de la concesionaria' : 'Nombre completo'}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
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
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            className={errors.email ? 'has-error' : ''}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Contrasena</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            className={errors.password ? 'has-error' : ''}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
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
