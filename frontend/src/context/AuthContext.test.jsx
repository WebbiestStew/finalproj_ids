import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, api } from '../api/client';
import { useAuth } from './useAuth';
import { renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

function Probe() {
  const { user, loading, login, logout } = useAuth();
  let state = 'anon';
  if (loading) state = 'loading';
  else if (user) state = user.email;

  return (
    <div>
      <span data-testid="state">{state}</span>
      <button onClick={() => login({ email: 'maria@example.com', password: 'x' })}>entrar</button>
      <button onClick={logout}>salir</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    api.me.mockReset();
    api.login.mockReset();
  });

  it('sin token guardado empieza como anónimo y no consulta al servidor', () => {
    renderApp(<Probe />);
    expect(screen.getByTestId('state')).toHaveTextContent('anon');
    expect(api.me).not.toHaveBeenCalled();
  });

  it('recupera la sesión a partir del token guardado', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    api.me.mockResolvedValue({ user: USERS.comprador });

    renderApp(<Probe />);
    expect(screen.getByTestId('state')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('maria@example.com'));
    expect(api.me).toHaveBeenCalledWith('token-valido');
  });

  it('descarta el token cuando el servidor responde 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-vencido');
    api.me.mockRejectedValue(new ApiError('Token inválido o expirado', 401));

    renderApp(<Probe />);
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('NO cierra la sesión por un fallo de red (status 0)', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido');
    api.me.mockRejectedValue(new ApiError('sin conexión', 0));

    renderApp(<Probe />);
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-valido');
  });

  it('login guarda el token y no repite la consulta a /me', async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ token: 'nuevo', user: USERS.comprador });

    renderApp(<Probe />);
    await user.click(screen.getByText('entrar'));

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('maria@example.com'));
    expect(localStorage.getItem(TOKEN_KEY)).toBe('nuevo');
    expect(api.me).not.toHaveBeenCalled();
  });

  it('logout borra la sesión', async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ token: 'nuevo', user: USERS.comprador });

    renderApp(<Probe />);
    await user.click(screen.getByText('entrar'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('maria@example.com'));

    await user.click(screen.getByText('salir'));
    expect(screen.getByTestId('state')).toHaveTextContent('anon');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('useAuth', () => {
  it('lanza un error claro fuera del proveedor', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Bare = () => {
      useAuth();
      return null;
    };
    expect(() => render(<Bare />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
