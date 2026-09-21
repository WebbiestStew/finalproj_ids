export const MIN_PASSWORD_LENGTH = 8;

// Comprobación lineal (sin regex con retroceso): algo@dominio.tld, sin espacios.
export function isValidEmail(value) {
  if (/\s/.test(value)) return false;
  const at = value.indexOf('@');
  const dot = value.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < value.length - 1;
}

export function validateRegistration({ name, email, password }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Escribe tu nombre (mínimo 2 caracteres).';
  else if (/[<>]/.test(name)) errors.name = 'El nombre no puede incluir los caracteres < o >.';
  if (!isValidEmail(email.trim())) errors.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  if (password.length < MIN_PASSWORD_LENGTH) errors.password = `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return errors;
}
