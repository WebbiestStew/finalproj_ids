import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { api } from '../api/client';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import { renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

describe('ProtectedRoute', () => {
  it('manda a iniciar sesión a quien no tiene sesión', () => {
    renderApp(
      <ProtectedRoute>
        <p>contenido privado</p>
      </ProtectedRoute>,
      { path: '/panel', routes: { '/iniciar-sesion': <p>pantalla de login</p> } }
    );

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('contenido privado')).not.toBeInTheDocument();
  });

  it('muestra el contenido cuando hay sesión válida', async () => {
    localStorage.setItem(TOKEN_KEY, 'token');
    api.me.mockResolvedValue({ user: USERS.comprador });

    renderApp(
      <ProtectedRoute>
        <p>contenido privado</p>
      </ProtectedRoute>,
      { path: '/panel' }
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('contenido privado')).toBeInTheDocument());
  });
});

describe('ProtectedRoute con roles', () => {
  it('deja pasar al rol permitido', async () => {
    localStorage.setItem(TOKEN_KEY, 'token');
    api.me.mockResolvedValue({ user: USERS.concesionaria });

    renderApp(
      <ProtectedRoute roles={['concesionaria']}>
        <p>inventario</p>
      </ProtectedRoute>,
      { path: '/inventario' }
    );

    await waitFor(() => expect(screen.getByText('inventario')).toBeInTheDocument());
  });

  it('manda a su panel a quien tiene otro rol', async () => {
    localStorage.setItem(TOKEN_KEY, 'token');
    api.me.mockResolvedValue({ user: USERS.comprador });

    renderApp(
      <ProtectedRoute roles={['concesionaria']}>
        <p>inventario</p>
      </ProtectedRoute>,
      { path: '/inventario', routes: { '/panel': <p>panel</p> } }
    );

    await waitFor(() => expect(screen.getByText('panel')).toBeInTheDocument());
    expect(screen.queryByText('inventario')).not.toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('deja ver login/registro a un visitante', () => {
    renderApp(
      <GuestRoute>
        <p>formulario</p>
      </GuestRoute>,
      { path: '/registro' }
    );
    expect(screen.getByText('formulario')).toBeInTheDocument();
  });

  it('redirige al panel a quien ya inició sesión', async () => {
    localStorage.setItem(TOKEN_KEY, 'token');
    api.me.mockResolvedValue({ user: USERS.comprador });

    renderApp(
      <GuestRoute>
        <p>formulario</p>
      </GuestRoute>,
      { path: '/registro', routes: { '/panel': <p>panel</p> } }
    );

    await waitFor(() => expect(screen.getByText('panel')).toBeInTheDocument());
    expect(screen.queryByText('formulario')).not.toBeInTheDocument();
  });
});
