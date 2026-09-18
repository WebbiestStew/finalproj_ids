import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { ApiError, api } from '../api/client';
import Dashboard from './Dashboard';
import { renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

const open = (role) => {
  localStorage.setItem(TOKEN_KEY, 'token');
  api.me.mockResolvedValue({ user: USERS[role] });
  return renderApp(<Dashboard />, { path: '/panel' });
};

describe('Dashboard', () => {
  beforeEach(() => {
    api.me.mockReset();
    api.listUsers.mockReset();
  });

  it('saluda por el primer nombre y muestra los datos de la cuenta', async () => {
    open('comprador');

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, María' })).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('a un comprador NO le pide la lista de usuarios y le ofrece el catálogo', async () => {
    open('comprador');

    expect(await screen.findByText('Encuentra tu próximo auto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
    expect(api.listUsers).not.toHaveBeenCalled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('a una concesionaria le lleva a su inventario', async () => {
    open('concesionaria');

    expect(await screen.findByText('Tu inventario')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a mi inventario' })).toHaveAttribute('href', '/inventario');
    expect(api.listUsers).not.toHaveBeenCalled();
  });

  it('a un administrador le muestra la tabla de usuarios con fechas legibles', async () => {
    api.listUsers.mockResolvedValue({
      users: [
        { id: 1, name: 'Admin DAuto', email: 'admin@dauto.com', role: 'admin', created_at: '2026-09-18 10:15:00' },
        { id: 2, name: 'María López', email: 'maria@example.com', role: 'comprador', created_at: '2026-09-18 11:00:00' },
      ],
    });
    open('admin');

    const table = await screen.findByRole('table');
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(3));
    expect(within(table).getByText('María López')).toBeInTheDocument();
    expect(within(table).getAllByText(/2026/).length).toBe(2);
    expect(api.listUsers).toHaveBeenCalledWith('token');
  });

  it('cierra la sesión si el token venció mientras se veía el panel (401)', async () => {
    api.listUsers.mockRejectedValue(new ApiError('Token inválido o expirado', 401));
    open('admin');

    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
  });

  it('muestra un error en la tabla si la carga falla por otra causa', async () => {
    api.listUsers.mockRejectedValue(new ApiError('Error interno del servidor', 500));
    open('admin');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token');
  });
});
