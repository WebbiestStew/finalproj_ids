import './PasswordStrength.css';

function scoreOf(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LABELS = ['Muy debil', 'Debil', 'Aceptable', 'Buena', 'Excelente'];

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const score = scoreOf(password);

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`password-strength-bar ${i < score ? `level-${score}` : ''}`} />
        ))}
      </div>
      <span className="password-strength-label">{LABELS[score]}</span>
    </div>
  );
}
