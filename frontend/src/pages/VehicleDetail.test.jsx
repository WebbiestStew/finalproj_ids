import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ApiError, api } from '../api/client';
import VehicleDetail from './VehicleDetail';
import { makeVehicle, renderApp } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  const { apiMock: factory } = await import('../test/apiMock');
  return { ...actual, api: factory() };
});

const open = (id = '1') => renderApp(<VehicleDetail />, { path: `/catalogo/${id}`, routePath: '/catalogo/:id' });

describe('VehicleDetail', () => {
  beforeEach(() => {
    api.getVehicle.mockReset();
  });

  it('muestra precio, especificaciones, descripción y concesionaria', async () => {
    api.getVehicle.mockResolvedValue({ vehicle: makeVehicle() });
    open('1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Toyota Corolla' })).toBeInTheDocument();
    expect(screen.getByText(/\$329,900/)).toBeInTheDocument();
    expect(screen.getByText('42,000 km')).toBeInTheDocument();
    expect(screen.getByText('Automática')).toBeInTheDocument();
    expect(screen.getByText('Único dueño')).toBeInTheDocument();
    expect(screen.getByText('Autos del Norte')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(api.getVehicle).toHaveBeenCalledWith('1');
    expect(document.title).toBe('Toyota Corolla 2021 — DAuto');
  });

  it('avisa honestamente que la imagen es una ilustración', async () => {
    api.getVehicle.mockResolvedValue({ vehicle: makeVehicle() });
    open();

    expect(await screen.findByText(/Ilustración referencial/)).toBeInTheDocument();
  });

  it('muestra el estado apartado y omite la descripción si no hay', async () => {
    api.getVehicle.mockResolvedValue({ vehicle: makeVehicle({ status: 'apartado', description: '' }) });
    open();

    expect(await screen.findByText('Apartado')).toBeInTheDocument();
    expect(screen.queryByText('Descripción')).not.toBeInTheDocument();
  });

  it('un vehículo inexistente muestra un mensaje claro y un camino de regreso', async () => {
    api.getVehicle.mockRejectedValue(new ApiError('Vehículo no encontrado', 404));
    open('999');

    expect(await screen.findByText('Este vehículo no existe o ya no está publicado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/catalogo');
  });

  it('otro tipo de error muestra el mensaje del servidor', async () => {
    api.getVehicle.mockRejectedValue(new ApiError('Error interno del servidor', 500));
    open();

    expect(await screen.findByText('Error interno del servidor')).toBeInTheDocument();
  });
});
