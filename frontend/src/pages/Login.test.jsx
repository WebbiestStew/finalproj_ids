import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { ApiError, api } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import Login from './Login';
import { USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

function open(entry = '/iniciar-sesion') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/iniciar-sesion" element={<Login />} />
          <Route path="/panel" element={<p>panel</p>} />
          <Route path="/otra" element={<p>otra ruta</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function fillAndSubmit(user) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'maria@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('Login', () => {
  beforeEach(() => {
    api.login.mockReset();
  });

  it('inicia sesión y va al panel', async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ token: 't', user: USERS.comprador });
    open();

    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText('panel')).toBeInTheDocument());
    expect(api.login).toHaveBeenCalledWith({ email: 'maria@example.com', password: 'password123' });
  });

  it('regresa a la página que el usuario intentaba abrir', async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ token: 't', user: USERS.comprador });
    open({ pathname: '/iniciar-sesion', state: { from: '/otra' } });

    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText('otra ruta')).toBeInTheDocument());
  });

  it('muestra como alerta el error de credenciales y permite reintentar', async () => {
    const user = userEvent.setup();
    api.login.mockRejectedValue(new ApiError('Credenciales inválidas', 401));
    open();

    await fillAndSubmit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled();
  });

  it('deshabilita el botón mientras se envía', async () => {
    const user = userEvent.setup();
    let resolve;
    api.login.mockReturnValue(new Promise((r) => (resolve = r)));
    open();

    await fillAndSubmit(user);
    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
    resolve({ token: 't', user: USERS.comprador });
    await waitFor(() => expect(screen.getByText('panel')).toBeInTheDocument());
  });
});
