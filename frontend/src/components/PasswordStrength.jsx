import { scoreOf } from '../utils/passwordScore';
import './PasswordStrength.css';

const LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];

export default function PasswordStrength({ password }) {
  const score = scoreOf(password);

  return (
    <div className="password-strength" aria-live="polite">
      {password && (
        <>
          <div className="password-strength-bars" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`password-strength-bar ${i < score ? `level-${score}` : ''}`} />
            ))}
          </div>
          <span className="password-strength-label">Seguridad: {LABELS[score].toLowerCase()}</span>
        </>
      )}
    </div>
  );
}
