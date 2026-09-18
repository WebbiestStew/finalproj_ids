import { describe, expect, it } from 'vitest';
import { scoreOf } from './passwordScore';
import { MIN_PASSWORD_LENGTH, validateRegistration } from './validateRegistration';

describe('scoreOf', () => {
  it('es 0 para una contraseña vacía o muy corta', () => {
    expect(scoreOf('')).toBe(0);
    expect(scoreOf('abc')).toBe(0);
  });

  it('sube con longitud, mayúsculas/minúsculas, números y símbolos', () => {
    expect(scoreOf('abcdefgh')).toBe(1);
    expect(scoreOf('abcdefG1')).toBe(3);
    expect(scoreOf('Abcdefgh1234!')).toBe(4);
  });

  it('nunca pasa de 4', () => {
    expect(scoreOf('Abcdefghijkl1234!!!!')).toBe(4);
  });
});

describe('validateRegistration', () => {
  const valid = { name: 'Ana García', email: 'ana@example.com', password: 'password123' };

  it('no reporta errores con datos válidos', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it('exige un nombre de al menos 2 caracteres', () => {
    expect(validateRegistration({ ...valid, name: ' a ' }).name).toMatch(/mínimo 2/);
  });

  it('rechaza < y > en el nombre (defensa contra XSS almacenado)', () => {
    expect(validateRegistration({ ...valid, name: '<script>alert(1)</script>' }).name).toMatch(/< o >/);
  });

  it('valida el formato del correo', () => {
    expect(validateRegistration({ ...valid, email: 'no-es-correo' }).email).toBeDefined();
  });

  it(`exige al menos ${MIN_PASSWORD_LENGTH} caracteres de contraseña`, () => {
    expect(validateRegistration({ ...valid, password: '1234567' }).password).toBeDefined();
  });
});
