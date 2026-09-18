import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, api } from '../api/client';
import Inventory from './Inventory';
import { makeVehicle, renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  const { apiMock: factory } = await import('../test/apiMock');
  return { ...actual, api: factory() };
});

const CARS = [
  makeVehicle({ id: 1, brand: 'Toyota', model: 'Corolla' }),
  makeVehicle({ id: 2, brand: 'Nissan', model: 'Versa', status: 'vendido' }),
];

const open = () => {
  localStorage.setItem(TOKEN_KEY, 'token');
  api.me.mockResolvedValue({ user: USERS.concesionaria });
  return renderApp(<Inventory />, { path: '/inventario' });
};

describe('Inventory', () => {
  beforeEach(() => {
    api.myVehicles.mockReset();
    api.setVehicleStatus.mockReset();
    api.deleteVehicle.mockReset();
    api.myVehicles.mockResolvedValue({ vehicles: CARS });
  });

  it('lista los autos propios con su estado y resume cuántos están publicados', async () => {
    open();

    expect(await screen.findByRole('link', { name: 'Toyota Corolla 2021' })).toHaveAttribute('href', '/catalogo/1');
    expect(screen.getByLabelText('Estado de Toyota Corolla')).toHaveValue('disponible');
    expect(screen.getByLabelText('Estado de Nissan Versa')).toHaveValue('vendido');
    expect(screen.getByText('1 publicados en el catálogo · 1 vendidos')).toBeInTheDocument();
    expect(api.myVehicles).toHaveBeenCalledWith('token');
  });

  it('cambiar el estado lo guarda y actualiza la fila', async () => {
    const user = userEvent.setup();
    api.setVehicleStatus.mockResolvedValue({ vehicle: { ...CARS[0], status: 'apartado' } });
    open();

    await user.selectOptions(await screen.findByLabelText('Estado de Toyota Corolla'), 'apartado');

    await waitFor(() => expect(screen.getByLabelText('Estado de Toyota Corolla')).toHaveValue('apartado'));
    expect(api.setVehicleStatus).toHaveBeenCalledWith('token', 1, 'apartado');
  });

  it('si el cambio de estado falla, muestra el error y conserva el estado anterior', async () => {
    const user = userEvent.setup();
    api.setVehicleStatus.mockRejectedValue(new ApiError('Solo puedes modificar los vehículos de tu concesionaria', 403));
    open();

    await user.selectOptions(await screen.findByLabelText('Estado de Toyota Corolla'), 'vendido');

    expect(await screen.findByRole('alert')).toHaveTextContent('Solo puedes modificar');
    expect(screen.getByLabelText('Estado de Toyota Corolla')).toHaveValue('disponible');
  });

  it('eliminar pide confirmación, y "Cancelar" no borra nada', async () => {
    const user = userEvent.setup();
    open();

    const row = (await screen.findByRole('link', { name: 'Toyota Corolla 2021' })).closest('li');
    await user.click(within(row).getByRole('button', { name: 'Eliminar' }));
    expect(within(row).getByText('¿Eliminar este auto?')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Cancelar' }));
    expect(api.deleteVehicle).not.toHaveBeenCalled();
    expect(within(row).getByLabelText('Estado de Toyota Corolla')).toBeInTheDocument();
  });

  it('confirmar la eliminación borra el auto de la lista', async () => {
    const user = userEvent.setup();
    api.deleteVehicle.mockResolvedValue(null);
    open();

    const row = (await screen.findByRole('link', { name: 'Toyota Corolla 2021' })).closest('li');
    await user.click(within(row).getByRole('button', { name: 'Eliminar' }));
    await user.click(within(row).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Toyota Corolla 2021' })).not.toBeInTheDocument());
    expect(api.deleteVehicle).toHaveBeenCalledWith('token', 1);
  });

  it('un error al eliminar se muestra y el auto sigue en la lista', async () => {
    const user = userEvent.setup();
    api.deleteVehicle.mockRejectedValue(new ApiError('Error interno del servidor', 500));
    open();

    const row = (await screen.findByRole('link', { name: 'Toyota Corolla 2021' })).closest('li');
    await user.click(within(row).getByRole('button', { name: 'Eliminar' }));
    await user.click(within(row).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(screen.getByRole('link', { name: 'Toyota Corolla 2021' })).toBeInTheDocument();
  });

  it('sin autos invita a publicar el primero', async () => {
    api.myVehicles.mockResolvedValue({ vehicles: [] });
    open();

    expect(await screen.findByText('Aún no has publicado autos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Publicar mi primer auto' })).toHaveAttribute('href', '/inventario/nuevo');
  });

  it('ofrece publicar y editar', async () => {
    open();

    expect(await screen.findByRole('link', { name: /Publicar vehículo/ })).toHaveAttribute('href', '/inventario/nuevo');
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/inventario/1/editar');
  });

  it('muestra el error si el inventario no carga', async () => {
    api.myVehicles.mockRejectedValue(new ApiError('Error interno del servidor', 500));
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
  });

  it('cierra la sesión si el token venció (401)', async () => {
    api.myVehicles.mockRejectedValue(new ApiError('Token inválido o expirado', 401));
    open();

    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
  });
});
