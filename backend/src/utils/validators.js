const { z } = require('zod');
const { COLORS, TRANSMISSIONS, FUELS, BODIES, STATUSES } = require('./vehicleOptions');
const { SORTS } = require('../models/Vehicle');

// Bloquea < > para prevenir XSS almacenado si algún cliente llega a renderizar
// el nombre sin escapar (hallazgo de la prueba de seguridad manual, ver informe de cierre).
const NAME_PATTERN = /^[^<>]*$/;

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo')
    .regex(NAME_PATTERN, 'El nombre contiene caracteres no permitidos'),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  role: z.enum(['concesionaria', 'comprador'], {
    errorMap: () => ({ message: "El rol debe ser 'concesionaria' o 'comprador'" }),
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const MIN_YEAR = 1980;
const MAX_PRICE = 100_000_000;
const MAX_MILEAGE = 1_000_000;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

const pickFrom = (values, label) => z.enum(values, { errorMap: () => ({ message: `${label} no válido` }) });
const safeText = (label, min, max) =>
  z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .min(min, `${label} es requerido`)
    .max(max, `${label} es demasiado largo`)
    .regex(NAME_PATTERN, `${label} contiene caracteres no permitidos`);

const vehicleSchema = z.object({
  brand: safeText('La marca', 2, 40),
  model: safeText('El modelo', 1, 60),
  year: z
    .number({ invalid_type_error: 'El año debe ser un número' })
    .int('El año debe ser un número entero')
    .min(MIN_YEAR, `El año no puede ser menor a ${MIN_YEAR}`)
    .refine((year) => year <= new Date().getFullYear() + 1, 'El año no puede ser mayor al próximo año'),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .int('El precio debe ser un número entero')
    .min(1, 'El precio debe ser mayor a 0')
    .max(MAX_PRICE, 'El precio es demasiado alto'),
  mileage: z
    .number({ invalid_type_error: 'El kilometraje debe ser un número' })
    .int('El kilometraje debe ser un número entero')
    .min(0, 'El kilometraje no puede ser negativo')
    .max(MAX_MILEAGE, 'El kilometraje es demasiado alto'),
  color: pickFrom(COLORS, 'El color'),
  transmission: pickFrom(TRANSMISSIONS, 'La transmisión'),
  fuel: pickFrom(FUELS, 'El combustible'),
  body: pickFrom(BODIES, 'La carrocería'),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción es demasiado larga')
    .regex(NAME_PATTERN, 'La descripción contiene caracteres no permitidos')
    .default(''),
});

const statusSchema = z.object({ status: pickFrom(STATUSES, 'El estado') });

// Query strings arrive as text; an empty filter box means "no filter".
const blankToUndefined = (value) => (value === '' ? undefined : value);
const queryInt = (min, max) => z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional());
const queryText = (max) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const listQuerySchema = z.object({
  q: queryText(60),
  brand: queryText(40),
  body: z.preprocess(blankToUndefined, pickFrom(BODIES, 'La carrocería').optional()),
  transmission: z.preprocess(blankToUndefined, pickFrom(TRANSMISSIONS, 'La transmisión').optional()),
  minPrice: queryInt(0, MAX_PRICE),
  maxPrice: queryInt(0, MAX_PRICE),
  minYear: queryInt(MIN_YEAR, 3000),
  maxYear: queryInt(MIN_YEAR, 3000),
  maxMileage: queryInt(0, MAX_MILEAGE),
  sort: z.preprocess(blankToUndefined, pickFrom(Object.keys(SORTS), 'El orden').default('recientes')),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)),
  offset: z.preprocess(blankToUndefined, z.coerce.number().int().min(0).default(0)),
});

module.exports = { registerSchema, loginSchema, vehicleSchema, statusSchema, listQuerySchema };
