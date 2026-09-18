import Icon from './Icon';
import './AuthLayout.css';

export default function AuthLayout({ icon = 'user', title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-icon">
          <Icon name={icon} size={28} />
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
