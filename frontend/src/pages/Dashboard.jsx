import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../api/client';
import { usePageTitle } from '../hooks/usePageTitle';
import Icon from '../components/Icon';
import RoleBadge from '../components/RoleBadge';
import './Dashboard.css';

const INTRO = {
  admin: 'Tienes visibilidad completa sobre las cuentas registradas en la plataforma.',
  concesionaria: 'Publica y administra tu inventario de vehículos desde aquí.',
  comprador: 'Explora el catálogo y encuentra tu próximo auto.',
};

// SQLite's datetime('now') is UTC without a zone marker.
function formatDate(value) {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  usePageTitle('Mi panel');
  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [list, setList] = useState({ status: isAdmin ? 'loading' : 'idle', users: [], error: '' });

  useEffect(() => {
    if (!isAdmin) return undefined;

    let cancelled = false;
    api
      .listUsers(token)
      .then((data) => {
        if (!cancelled) setList({ status: 'ready', users: data.users, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          logout();
          return;
        }
        setList({ status: 'error', users: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, token, logout]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

  return (
    <div className="container dash">
      <header className="dash-head">
        <p className="dash-kicker">Mi panel</p>
        <h1>Hola, {firstName}</h1>
        <p className="dash-intro">{INTRO[user.role]}</p>
      </header>

      <section className="group" aria-labelledby="account-title">
        <h2 className="group-title" id="account-title">
          Tu cuenta
        </h2>
        <dl className="list">
          <div className="list-row">
            <dt>Nombre</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="list-row">
            <dt>Correo</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="list-row">
            <dt>Rol</dt>
            <dd>
              <RoleBadge role={user.role} />
            </dd>
          </div>
          <div className="list-row">
            <dt>ID de cuenta</dt>
            <dd>#{user.id}</dd>
          </div>
        </dl>
      </section>

      {isAdmin ? (
        <section className="group" aria-labelledby="users-title">
          <h2 className="group-title" id="users-title">
            Usuarios registrados
            {list.status === 'ready' && <span className="count">{list.users.length}</span>}
          </h2>

          {list.status === 'error' && (
            <p className="alert alert-error" role="alert">
              <Icon name="alert" size={18} />
              <span>{list.error}</span>
            </p>
          )}

          <div className="list table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Registro</th>
                </tr>
              </thead>
              <tbody aria-busy={list.status === 'loading'}>
                {list.status === 'loading' &&
                  [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td>
                        <span className="skeleton" style={{ width: '70%' }} />
                      </td>
                      <td>
                        <span className="skeleton" style={{ width: '85%' }} />
                      </td>
                      <td>
                        <span className="skeleton" style={{ width: '5.5rem' }} />
                      </td>
                      <td>
                        <span className="skeleton" style={{ width: '4.5rem' }} />
                      </td>
                    </tr>
                  ))}
                {list.status === 'ready' &&
                  list.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="empty" aria-labelledby="next-title">
          <Icon name="car" size={36} className="empty-icon" />
          {user.role === 'concesionaria' ? (
            <>
              <h2 id="next-title">Tu inventario</h2>
              <p>Publica tus autos, cambia su estado cuando se aparten o se vendan y mantén el catálogo al día.</p>
              <div className="empty-actions">
                <Link to="/inventario" className="btn btn-primary">
                  Ir a mi inventario
                </Link>
                <Link to="/inventario/nuevo" className="btn btn-secondary">
                  Publicar vehículo
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 id="next-title">Encuentra tu próximo auto</h2>
              <p>Filtra por marca, precio y año. El simulador de financiamiento y las citas de prueba de manejo llegan en los próximos sprints.</p>
              <div className="empty-actions">
                <Link to="/catalogo" className="btn btn-primary">
                  Ver catálogo
                </Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
