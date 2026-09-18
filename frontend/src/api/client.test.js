import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './client';

function mockFetch(body, { status = 200, json = true } = {}) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => (json ? 'application/json; charset=utf-8' : 'text/html') },
    json: async () => body,
  };
  globalThis.fetch = vi.fn().mockResolvedValue(response);
  return globalThis.fetch;
}

describe('api client', () => {
  afterEach(() => {
    delete globalThis.fetch;
  });

  it('envía el token como Bearer y devuelve el JSON', async () => {
    const fetchMock = mockFetch({ user: { id: 1 } });
    const data = await api.me('abc123');

    expect(data).toEqual({ user: { id: 1 } });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/me$/);
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('serializa el cuerpo en POST', async () => {
    const fetchMock = mockFetch({ token: 't' }, { status: 201 });
    await api.register({ name: 'Ana' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'Ana' });
  });

  it('une los mensajes cuando el servidor devuelve una lista de errores', async () => {
    mockFetch({ error: ['Correo inválido', 'Contraseña corta'] }, { status: 400 });
    await expect(api.login({})).rejects.toMatchObject({ status: 400, message: 'Correo inválido Contraseña corta' });
  });

  it('usa el mensaje del servidor para errores simples', async () => {
    mockFetch({ error: 'Credenciales inválidas' }, { status: 401 });
    await expect(api.login({})).rejects.toBeInstanceOf(ApiError);
  });

  it('tiene un mensaje genérico cuando la respuesta de error no es JSON', async () => {
    mockFetch(null, { status: 502, json: false });
    await expect(api.me('t')).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/inesperado/) });
  });

  it('arma la consulta del catálogo omitiendo filtros vacíos', async () => {
    const fetchMock = mockFetch({ vehicles: [], total: 0 });
    await api.listVehicles({ q: 'corolla', brand: '', maxPrice: 300000, minYear: undefined, sort: null });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/vehicles\?q=corolla&maxPrice=300000$/);
  });

  it('sin filtros no agrega signo de interrogación', async () => {
    const fetchMock = mockFetch({ vehicles: [], total: 0 });
    await api.listVehicles();

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/vehicles$/);
  });

  it.each([
    ['getVehicle', ['7'], 'GET', /\/api\/vehicles\/7$/],
    ['vehicleBrands', [], 'GET', /\/api\/vehicles\/brands$/],
    ['myVehicles', ['tok'], 'GET', /\/api\/vehicles\/mine$/],
    ['createVehicle', ['tok', { brand: 'Kia' }], 'POST', /\/api\/vehicles$/],
    ['updateVehicle', ['tok', 7, { brand: 'Kia' }], 'PUT', /\/api\/vehicles\/7$/],
    ['setVehicleStatus', ['tok', 7, 'vendido'], 'PATCH', /\/api\/vehicles\/7\/status$/],
    ['deleteVehicle', ['tok', 7], 'DELETE', /\/api\/vehicles\/7$/],
  ])('%s usa el método y la ruta correctos', async (method, args, verb, urlPattern) => {
    const fetchMock = mockFetch({});
    await api[method](...args);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(urlPattern);
    expect(options.method).toBe(verb);
  });

  it('traduce un fallo de red a un error en español con status 0', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.me('t')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/No se pudo conectar/) });
  });
});
