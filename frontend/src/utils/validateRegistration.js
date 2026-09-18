export const MIN_PASSWORD_LENGTH = 8;

export function validateRegistration({ name, email, password }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Escribe tu nombre (mínimo 2 caracteres).';
  else if (/[<>]/.test(name)) errors.name = 'El nombre no puede incluir los caracteres < o >.';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  if (password.length < MIN_PASSWORD_LENGTH) errors.password = `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return errors;
}
