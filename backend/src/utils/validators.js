const { z } = require('zod');

// Bloquea < > para prevenir XSS almacenado si el frontend llega a renderizar
// el nombre sin escapar (hallazgo de la prueba de seguridad manual, ver informe de cierre).
const NAME_PATTERN = /^[^<>]*$/;

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120)
    .regex(NAME_PATTERN, 'El nombre contiene caracteres no permitidos'),
  email: z.string().trim().toLowerCase().email('Correo invalido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(128),
  role: z.enum(['concesionaria', 'comprador'], {
    errorMap: () => ({ message: "El rol debe ser 'concesionaria' o 'comprador'" }),
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

module.exports = { registerSchema, loginSchema };
