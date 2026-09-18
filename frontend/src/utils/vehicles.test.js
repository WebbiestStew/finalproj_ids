import { describe, expect, it } from 'vitest';
import { formatKm, formatPrice } from './format';
import { validateVehicle } from './validateVehicle';

const valid = {
  brand: 'Toyota',
  model: 'Corolla',
  year: '2021',
  price: '329900',
  mileage: '42000',
  color: 'Blanco',
  transmission: 'Automática',
  fuel: 'Gasolina',
  body: 'Sedán',
  description: '',
};

describe('format', () => {
  it('formatea el precio en pesos mexicanos sin decimales', () => {
    expect(formatPrice(329900)).toMatch(/\$329,900/);
  });

  it('formatea el kilometraje con separador de miles', () => {
    expect(formatKm(42000)).toBe('42,000 km');
  });
});

describe('validateVehicle', () => {
  it('acepta un vehículo válido', () => {
    expect(validateVehicle(valid)).toEqual({});
  });

  it.each([
    ['marca corta', { brand: 'T' }, 'brand'],
    ['marca con marcado', { brand: '<b>' }, 'brand'],
    ['modelo vacío', { model: ' ' }, 'model'],
    ['modelo con marcado', { model: '<i>' }, 'model'],
    ['año antiguo', { year: '1950' }, 'year'],
    ['año futuro', { year: '2100' }, 'year'],
    ['año decimal', { year: '2020.5' }, 'year'],
    ['precio cero', { price: '0' }, 'price'],
    ['precio vacío', { price: '' }, 'price'],
    ['kilometraje vacío', { mileage: '' }, 'mileage'],
    ['kilometraje negativo', { mileage: '-5' }, 'mileage'],
    ['color inexistente', { color: 'Fucsia' }, 'color'],
    ['transmisión inexistente', { transmission: 'CVT' }, 'transmission'],
    ['combustible inexistente', { fuel: 'Vapor' }, 'fuel'],
    ['carrocería inexistente', { body: 'Tanque' }, 'body'],
    ['descripción con marcado', { description: '<script>' }, 'description'],
  ])('rechaza %s', (_label, override, field) => {
    expect(Object.keys(validateVehicle({ ...valid, ...override }))).toEqual([field]);
  });

  it('permite kilometraje 0 (auto nuevo)', () => {
    expect(validateVehicle({ ...valid, mileage: '0' })).toEqual({});
  });
});
