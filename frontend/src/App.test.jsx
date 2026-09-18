import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { api } from './api/client';
import { makeVehicle } from './test/utils';
import App from './App';

vi.mock('./api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn(), listVehicles: vi.fn(async () => ({ vehicles: [], total: 0 })), vehicleBrands: vi.fn(async () => ({ brands: [] })) } };
});

describe('App', () => {
  it('muestra la landing con sus landmarks y el enlace para saltar al contenido', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu próximo auto');
    expect(document.title).toBe('DAuto — Compra y venta de vehículos');
  });

  it('muestra la página 404 en rutas desconocidas', () => {
    window.history.pushState({}, '', '/no-existe');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('No encontramos esa página');
  });

  it('la landing muestra los autos recién publicados con enlace al catálogo', async () => {
    api.listVehicles.mockResolvedValueOnce({ vehicles: [makeVehicle({ id: 5, brand: 'Kia', model: 'Rio' })], total: 1 });
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(await screen.findByRole('link', { name: /Kia Rio/ })).toHaveAttribute('href', '/catalogo/5');
    expect(screen.getByRole('link', { name: 'Ver todo el catálogo' })).toHaveAttribute('href', '/catalogo');
    expect(api.listVehicles).toHaveBeenCalledWith({ limit: 4, sort: 'recientes' });
  });

  it('si el catálogo no responde, la landing sigue mostrándose sin esa sección', () => {
    api.listVehicles.mockRejectedValueOnce(new Error('sin conexión'));
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu próximo auto');
    expect(screen.queryByText('Recién publicados.')).not.toBeInTheDocument();
  });
});
