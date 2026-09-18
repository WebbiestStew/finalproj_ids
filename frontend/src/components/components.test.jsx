import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../api/client';
import FormAlert from './FormAlert';
import PasswordInput from './PasswordInput';
import PasswordStrength from './PasswordStrength';
import RoleBadge from './RoleBadge';
import UserMenu from './UserMenu';
import { renderApp, TOKEN_KEY, USERS } from '../test/utils';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, api: { register: vi.fn(), login: vi.fn(), me: vi.fn(), listUsers: vi.fn() } };
});

describe('FormAlert', () => {
  it('anuncia el mensaje con role="alert" y no renderiza nada sin mensaje', () => {
    const { rerender } = render(<FormAlert message="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<FormAlert message="Algo salió mal" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal');
  });
});

describe('PasswordInput', () => {
  it('alterna entre ocultar y mostrar la contraseña, exponiendo el estado con aria-pressed', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="clave" defaultValue="secreto" />);

    const input = screen.getByLabelText('clave');
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('PasswordStrength', () => {
  it('no muestra nada con la contraseña vacía', () => {
    render(<PasswordStrength password="" />);
    expect(screen.queryByText(/Seguridad/)).not.toBeInTheDocument();
  });

  it.each([
    ['abc', 'muy débil'],
    ['abcdefG1', 'buena'],
    ['Abcdefgh1234!', 'excelente'],
  ])('describe "%s" como %s', (password, label) => {
    render(<PasswordStrength password={password} />);
    expect(screen.getByText(`Seguridad: ${label}`)).toBeInTheDocument();
  });
});

describe('RoleBadge', () => {
  it('traduce el rol a su etiqueta y deja pasar uno desconocido', () => {
    const { rerender } = render(<RoleBadge role="admin" />);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    rerender(<RoleBadge role="otro" />);
    expect(screen.getByText('otro')).toBeInTheDocument();
  });
});

describe('UserMenu', () => {
  async function openMenu() {
    localStorage.setItem(TOKEN_KEY, 'token');
    api.me.mockResolvedValue({ user: USERS.comprador });
    const user = userEvent.setup();
    renderApp(<UserMenu />, { path: '/', routes: {} });
    const trigger = await screen.findByRole('button', { name: /Menú de María López/ });
    return { user, trigger };
  }

  it('muestra las iniciales y abre/cierra el panel con aria-expanded', async () => {
    const { user, trigger } = await openMenu();
    expect(trigger).toHaveTextContent('ML');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi panel' })).toBeInTheDocument();
  });

  it('se cierra con Escape y devuelve el foco al botón', async () => {
    const { user, trigger } = await openMenu();
    await user.click(trigger);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByText('maria@example.com')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('se cierra al hacer clic fuera', async () => {
    const { user, trigger } = await openMenu();
    await user.click(trigger);
    await user.click(document.body);

    await waitFor(() => expect(screen.queryByText('maria@example.com')).not.toBeInTheDocument());
  });

  it('cerrar sesión borra el token', async () => {
    const { user, trigger } = await openMenu();
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
