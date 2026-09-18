import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, api } from '../api/client';
import Register from './Register';
import { renderApp, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

const open = () => renderApp(<Register />, { path: '/registro', routes: { '/panel': <p>panel</p> } });

describe('Register', () => {
  beforeEach(() => {
    api.register.mockReset();
  });

  it('muestra errores accesibles en línea y no llama al servidor si los datos son inválidos', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const name = screen.getByLabelText('Nombre completo');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(/mínimo 2 caracteres/);
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
    expect(api.register).not.toHaveBeenCalled();
  });

  it('quita el error de un campo en cuanto se corrige', async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana García');

    expect(screen.getByLabelText('Nombre completo')).not.toHaveAttribute('aria-invalid');
  });

  it('cambia entre comprador y concesionaria con clic y con las flechas del teclado', async () => {
    const user = userEvent.setup();
    open();

    const comprador = screen.getByRole('radio', { name: 'Soy comprador' });
    const concesionaria = screen.getByRole('radio', { name: 'Soy concesionaria' });
    expect(comprador).toBeChecked();

    await user.click(concesionaria);
    expect(concesionaria).toBeChecked();
    expect(screen.getByLabelText('Nombre de la concesionaria')).toBeInTheDocument();

    concesionaria.focus();
    await user.keyboard('{ArrowLeft}');
    expect(comprador).toBeChecked();
  });

  it('envía el registro con el rol elegido y navega al panel', async () => {
    const user = userEvent.setup();
    api.register.mockResolvedValue({ token: 't', user: { ...USERS.comprador, role: 'concesionaria' } });
    open();

    await user.click(screen.getByRole('radio', { name: 'Soy concesionaria' }));
    await user.type(screen.getByLabelText('Nombre de la concesionaria'), 'Autos del Norte');
    await user.type(screen.getByLabelText('Correo electrónico'), 'contacto@autosnorte.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(screen.getByText('panel')).toBeInTheDocument());
    expect(api.register).toHaveBeenCalledWith({
      name: 'Autos del Norte',
      email: 'contacto@autosnorte.com',
      password: 'password123',
      role: 'concesionaria',
    });
  });

  it('anuncia como alerta el error que devuelve el servidor', async () => {
    const user = userEvent.setup();
    api.register.mockRejectedValue(new ApiError('Ya existe una cuenta con ese correo', 409));
    open();

    await user.type(screen.getByLabelText('Nombre completo'), 'Ana García');
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo');
    expect(screen.queryByText('panel')).not.toBeInTheDocument();
  });

  it('actualiza el título de la pestaña', () => {
    open();
    expect(document.title).toBe('Crear cuenta — DAuto');
  });
});
