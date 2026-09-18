import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, api } from '../api/client';
import ProtectedRoute from '../components/ProtectedRoute';
import VehicleForm from './VehicleForm';
import { makeVehicle, renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  const { apiMock: factory } = await import('../test/apiMock');
  return { ...actual, api: factory() };
});

const guarded = (
  <ProtectedRoute roles={['concesionaria']}>
    <VehicleForm />
  </ProtectedRoute>
);
const routes = { '/inventario': <p>lista de inventario</p> };

function login(user = USERS.concesionaria) {
  localStorage.setItem(TOKEN_KEY, 'token');
  api.me.mockResolvedValue({ user });
}

async function fill(user) {
  await user.type(await screen.findByLabelText('Marca'), 'Toyota');
  await user.type(screen.getByLabelText('Modelo'), 'Corolla');
  await user.type(screen.getByLabelText('Precio (MXN)'), '329900');
  await user.type(screen.getByLabelText('Kilometraje'), '42000');
}

describe('VehicleForm (publicar)', () => {
  beforeEach(() => {
    api.createVehicle.mockReset();
    api.updateVehicle.mockReset();
    api.getVehicle.mockReset();
    login();
  });

  const openNew = () => renderApp(guarded, { path: '/inventario/nuevo', routes });

  it('no envía nada y muestra los errores enlazados a cada campo si faltan datos', async () => {
    const user = userEvent.setup();
    openNew();

    await user.click(await screen.findByRole('button', { name: 'Publicar vehículo' }));

    expect(screen.getByLabelText('Marca')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Marca')).toHaveAccessibleDescription('Escribe la marca.');
    expect(screen.getByLabelText('Precio (MXN)')).toHaveAttribute('aria-invalid', 'true');
    expect(api.createVehicle).not.toHaveBeenCalled();
  });

  it('publica con números (no texto) y regresa al inventario', async () => {
    const user = userEvent.setup();
    api.createVehicle.mockResolvedValue({ vehicle: makeVehicle() });
    openNew();

    await fill(user);
    await user.selectOptions(screen.getByLabelText('Carrocería'), 'SUV');
    await user.selectOptions(screen.getByLabelText('Color'), 'Rojo');
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Único dueño');
    await user.click(screen.getByRole('button', { name: 'Publicar vehículo' }));

    await waitFor(() => expect(screen.getByText('lista de inventario')).toBeInTheDocument());
    expect(api.createVehicle).toHaveBeenCalledWith('token', {
      brand: 'Toyota',
      model: 'Corolla',
      year: new Date().getFullYear(),
      price: 329900,
      mileage: 42000,
      color: 'Rojo',
      transmission: 'Automática',
      fuel: 'Gasolina',
      body: 'SUV',
      description: 'Único dueño',
    });
  });

  it('la vista previa refleja la carrocería y el color elegidos', async () => {
    const user = userEvent.setup();
    const { container } = openNew();

    await user.selectOptions(await screen.findByLabelText('Color'), 'Azul');

    await waitFor(() => expect(container.querySelector('.car-art-body')).toHaveAttribute('fill', '#1f5fbf'));
  });

  it('muestra el error del servidor y conserva lo escrito', async () => {
    const user = userEvent.setup();
    api.createVehicle.mockRejectedValue(new ApiError('El año no puede ser mayor al próximo año', 400));
    openNew();

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Publicar vehículo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El año no puede ser mayor');
    expect(screen.getByLabelText('Marca')).toHaveValue('Toyota');
  });

  it('corregir un campo limpia su error', async () => {
    const user = userEvent.setup();
    openNew();

    await user.click(await screen.findByRole('button', { name: 'Publicar vehículo' }));
    await user.type(screen.getByLabelText('Marca'), 'Kia');

    expect(screen.getByLabelText('Marca')).not.toHaveAttribute('aria-invalid');
  });
});

describe('VehicleForm (editar)', () => {
  beforeEach(() => {
    api.updateVehicle.mockReset();
    api.getVehicle.mockReset();
  });

  const openEdit = () => renderApp(guarded, { path: '/inventario/1/editar', routePath: '/inventario/:id/editar', routes });

  it('carga el vehículo, permite cambiarlo y guarda con PUT', async () => {
    const user = userEvent.setup();
    login();
    api.getVehicle.mockResolvedValue({ vehicle: makeVehicle({ dealer_id: 3 }) });
    api.updateVehicle.mockResolvedValue({ vehicle: makeVehicle() });
    openEdit();

    const price = await screen.findByLabelText('Precio (MXN)');
    expect(price).toHaveValue(329900);
    await user.clear(price);
    await user.type(price, '300000');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(screen.getByText('lista de inventario')).toBeInTheDocument());
    expect(api.updateVehicle).toHaveBeenCalledWith('token', '1', expect.objectContaining({ price: 300000, brand: 'Toyota' }));
  });

  it('un vehículo de otra concesionaria regresa al inventario sin mostrar el formulario', async () => {
    login();
    api.getVehicle.mockResolvedValue({ vehicle: makeVehicle({ dealer_id: 99 }) });
    openEdit();

    await waitFor(() => expect(screen.getByText('lista de inventario')).toBeInTheDocument());
  });

  it('si el vehículo no existe muestra el error', async () => {
    login();
    api.getVehicle.mockRejectedValue(new ApiError('Vehículo no encontrado', 404));
    openEdit();

    expect(await screen.findByText('Vehículo no encontrado')).toBeInTheDocument();
  });
});
