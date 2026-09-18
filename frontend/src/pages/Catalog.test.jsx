import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, api } from '../api/client';
import Catalog from './Catalog';
import { makeVehicle, renderApp } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  const { apiMock: factory } = await import('../test/apiMock');
  return { ...actual, api: factory() };
});

const CARS = [
  makeVehicle({ id: 1, brand: 'Toyota', model: 'Corolla' }),
  makeVehicle({ id: 2, brand: 'Nissan', model: 'Versa', price: 214900, status: 'apartado' }),
];

const open = (path = '/catalogo') => renderApp(<Catalog />, { path, routePath: '/catalogo' });
const lastListCall = () => api.listVehicles.mock.calls.at(-1)[0];

describe('Catalog', () => {
  beforeEach(() => {
    api.listVehicles.mockReset();
    api.vehicleBrands.mockReset();
    api.listVehicles.mockResolvedValue({ vehicles: CARS, total: 2 });
    api.vehicleBrands.mockResolvedValue({ brands: ['Nissan', 'Toyota'] });
  });

  it('muestra los autos con precio, datos clave y enlace a su ficha', async () => {
    open();

    const link = await screen.findByRole('link', { name: /Toyota Corolla/ });
    expect(link).toHaveAttribute('href', '/catalogo/1');
    expect(within(link).getByText(/\$329,900/)).toBeInTheDocument();
    expect(within(link).getByText(/2021 · 42,000 km · Automática/)).toBeInTheDocument();
    expect(await screen.findByText('2 autos')).toBeInTheDocument();
  });

  it('marca como "Apartado" los autos apartados', async () => {
    open();
    const card = await screen.findByRole('link', { name: /Nissan Versa/ });
    expect(within(card).getByText('Apartado')).toBeInTheDocument();
  });

  it('carga las marcas disponibles en el filtro', async () => {
    open();
    const select = await screen.findByLabelText('Marca');
    await waitFor(() => expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Todas', 'Nissan', 'Toyota']));
  });

  it('filtrar por marca vuelve a consultar con ese parámetro', async () => {
    const user = userEvent.setup();
    open();
    await screen.findByText('2 autos');
    await waitFor(() => expect(within(screen.getByLabelText('Marca')).getAllByRole('option')).toHaveLength(3));

    await user.selectOptions(screen.getByLabelText('Marca'), 'Nissan');

    await waitFor(() => expect(lastListCall()).toMatchObject({ brand: 'Nissan', limit: 12 }));
  });

  it('cada filtro se traduce al parámetro de la API', async () => {
    const user = userEvent.setup();
    open();
    await screen.findByText('2 autos');

    await user.selectOptions(screen.getByLabelText('Carrocería'), 'SUV');
    await user.selectOptions(screen.getByLabelText('Precio máximo'), '300000');
    await user.selectOptions(screen.getByLabelText('Año'), '2020');
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'precio_asc');

    await waitFor(() => expect(lastListCall()).toMatchObject({ body: 'SUV', maxPrice: '300000', minYear: '2020', sort: 'precio_asc' }));
  });

  it('lee los filtros de la URL (enlaces compartibles)', async () => {
    open('/catalogo?marca=Toyota&precio=400000');

    await screen.findByText('2 autos');
    expect(lastListCall()).toMatchObject({ brand: 'Toyota', maxPrice: '400000' });
    expect(screen.getByLabelText('Precio máximo')).toHaveValue('400000');
  });

  it('la búsqueda por texto espera un momento antes de consultar (no una petición por tecla)', async () => {
    const user = userEvent.setup();
    open();
    await screen.findByText('2 autos');
    const callsBefore = api.listVehicles.mock.calls.length;

    await user.type(screen.getByLabelText('Buscar'), 'corolla');
    expect(api.listVehicles.mock.calls.length).toBe(callsBefore);

    await waitFor(() => expect(lastListCall()).toMatchObject({ q: 'corolla' }));
    expect(api.listVehicles.mock.calls.length).toBe(callsBefore + 1);
  });

  it('sin resultados: explica y permite limpiar los filtros', async () => {
    const user = userEvent.setup();
    api.listVehicles.mockResolvedValue({ vehicles: [], total: 0 });
    open('/catalogo?marca=Tesla');

    expect(await screen.findByText('No encontramos autos con esos filtros')).toBeInTheDocument();
    api.listVehicles.mockResolvedValue({ vehicles: CARS, total: 2 });
    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);

    expect(await screen.findByText('2 autos')).toBeInTheDocument();
    expect(lastListCall()).not.toHaveProperty('brand');
  });

  it('"Ver más" pide la siguiente página y la agrega', async () => {
    const user = userEvent.setup();
    api.listVehicles.mockResolvedValueOnce({ vehicles: [CARS[0]], total: 2 });
    open();

    await screen.findByRole('link', { name: /Toyota Corolla/ });
    api.listVehicles.mockResolvedValueOnce({ vehicles: [CARS[1]], total: 2 });
    await user.click(screen.getByRole('button', { name: 'Ver más (1)' }));

    expect(await screen.findByRole('link', { name: /Nissan Versa/ })).toBeInTheDocument();
    expect(lastListCall()).toMatchObject({ offset: 1 });
    expect(screen.queryByRole('button', { name: /Ver más/ })).not.toBeInTheDocument();
  });

  it('un error al cargar más se muestra sin perder lo ya cargado', async () => {
    const user = userEvent.setup();
    api.listVehicles.mockResolvedValueOnce({ vehicles: [CARS[0]], total: 2 });
    open();
    await screen.findByRole('link', { name: /Toyota Corolla/ });

    api.listVehicles.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await user.click(screen.getByRole('button', { name: 'Ver más (1)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
    expect(screen.getByRole('link', { name: /Toyota Corolla/ })).toBeInTheDocument();
  });

  it('muestra un error accesible si el catálogo no carga', async () => {
    api.listVehicles.mockRejectedValue(new ApiError('Error interno del servidor', 500));
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
  });

  it('si fallan las marcas, el catálogo sigue funcionando', async () => {
    api.vehicleBrands.mockRejectedValue(new ApiError('nope', 500));
    open();

    expect(await screen.findByText('2 autos')).toBeInTheDocument();
  });

  it('usa singular con un solo resultado', async () => {
    api.listVehicles.mockResolvedValue({ vehicles: [CARS[0]], total: 1 });
    open();

    expect(await screen.findByText('1 auto')).toBeInTheDocument();
  });
});
