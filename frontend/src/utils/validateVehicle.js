import { BODIES, COLORS, FUELS, TRANSMISSIONS } from './vehicleOptions';

const MIN_YEAR = 1980;

// Same rules as the API (backend/src/utils/validators.js) so mistakes show up
// inline, before a request is made. The server stays the source of truth.
export function validateVehicle(values) {
  const errors = {};
  const year = Number(values.year);
  const price = Number(values.price);
  const mileage = Number(values.mileage);

  if (values.brand.trim().length < 2) errors.brand = 'Escribe la marca.';
  else if (/[<>]/.test(values.brand)) errors.brand = 'La marca no puede incluir < o >.';
  if (!values.model.trim()) errors.model = 'Escribe el modelo.';
  else if (/[<>]/.test(values.model)) errors.model = 'El modelo no puede incluir < o >.';
  if (!Number.isInteger(year) || year < MIN_YEAR || year > new Date().getFullYear() + 1) {
    errors.year = `Escribe un año entre ${MIN_YEAR} y ${new Date().getFullYear() + 1}.`;
  }
  if (!Number.isInteger(price) || price < 1) errors.price = 'Escribe un precio en pesos mayor a 0.';
  if (values.mileage === '' || !Number.isInteger(mileage) || mileage < 0) errors.mileage = 'Escribe el kilometraje (0 si es nuevo).';
  if (!(values.color in COLORS)) errors.color = 'Elige un color.';
  if (!TRANSMISSIONS.includes(values.transmission)) errors.transmission = 'Elige la transmisión.';
  if (!FUELS.includes(values.fuel)) errors.fuel = 'Elige el combustible.';
  if (!BODIES.includes(values.body)) errors.body = 'Elige la carrocería.';
  if (/[<>]/.test(values.description)) errors.description = 'La descripción no puede incluir < o >.';
  return errors;
}
