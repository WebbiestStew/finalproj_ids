import { useState } from 'react';
import Icon from './Icon';
import './PasswordInput.css';

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={20} />
      </button>
    </div>
  );
}
