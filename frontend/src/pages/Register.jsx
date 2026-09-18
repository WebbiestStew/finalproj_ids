import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import FormAlert from '../components/FormAlert';
import { useAuth } from '../context/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { MIN_PASSWORD_LENGTH, validateRegistration } from '../utils/validateRegistration';

const ROLES = [
  { value: 'comprador', label: 'Soy comprador' },
  { value: 'concesionaria', label: 'Soy concesionaria' },
];

export default function Register() {
  usePageTitle('Crear cuenta');
  const { register } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const highlightTransition = prefersReducedMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.3 };

  const [role, setRole] = useState('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleRoleKeys = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setRole((current) => (current === 'comprador' ? 'concesionaria' : 'comprador'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const found = validateRegistration({ name, email, password });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate('/panel', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldProps = (field) => ({
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  return (
    <AuthLayout
      icon="user"
      title="Crea tu cuenta"
      subtitle="Elige el tipo de cuenta que necesitas para empezar."
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
        </>
      }
    >
      <div className="segmented" role="radiogroup" aria-label="Tipo de cuenta" onKeyDown={handleRoleKeys}>
        {ROLES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            tabIndex={role === value ? 0 : -1}
            onClick={() => setRole(value)}
          >
            {role === value && (
              <motion.span layoutId="segmentedHighlight" className="segmented-highlight" transition={highlightTransition} />
            )}
            <span className="segmented-label">{label}</span>
          </button>
        ))}
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
            placeholder={role === 'concesionaria' ? 'Autos del Norte' : 'Ana García'}
            autoComplete="name"
            {...fieldProps('name')}
          />
          {errors.name && (
            <span className="field-error" id="name-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            {...fieldProps('email')}
          />
          {errors.email && (
            <span className="field-error" id="email-error">
              {errors.email}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            autoComplete="new-password"
            {...fieldProps('password')}
          />
          <PasswordStrength password={password} />
          {errors.password && (
            <span className="field-error" id="password-error">
              {errors.password}
            </span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
