import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import RoleBadge from '../components/RoleBadge';
import './Dashboard.css';

const WELCOME_COPY = {
  admin: 'Tienes visibilidad completa sobre las cuentas registradas en la plataforma.',
  concesionaria: 'Pronto podras publicar tu inventario de vehiculos desde aqui.',
  comprador: 'Pronto podras buscar autos, simular financiamiento y agendar tu test drive desde aqui.',
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    setLoadingUsers(true);
    api
      .listUsers(token)
      .then((data) => setUsers(data.users))
      .catch((err) => setUsersError(err.message))
      .finally(() => setLoadingUsers(false));
  }, [user, token]);

  if (!user) return null;

  return (
    <div className="container dashboard fade-in">
      <div className="card dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Mi panel</p>
          <h1>Hola, {user.name.split(' ')[0]} 👋</h1>
          <p className="dashboard-copy">{WELCOME_COPY[user.role]}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-panel">
          <h2>Tu perfil</h2>
          <dl className="profile-list">
            <div>
              <dt>Nombre</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>
                <RoleBadge role={user.role} />
              </dd>
            </div>
            <div>
              <dt>ID de cuenta</dt>
              <dd>#{user.id}</dd>
            </div>
          </dl>
        </div>

        {user.role === 'admin' && (
          <div className="card dashboard-panel dashboard-panel-wide">
            <div className="dashboard-panel-header">
              <h2>Usuarios registrados</h2>
              <span className="pill pill-soon">{users.length} en total</span>
            </div>

            {usersError && <div className="alert alert-error">{usersError}</div>}

            {loadingUsers ? (
              <p className="dashboard-copy">Cargando usuarios...</p>
            ) : (
              <div className="table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {user.role !== 'admin' && (
          <div className="card dashboard-panel dashboard-panel-wide dashboard-empty">
            <div className="dashboard-empty-icon">🚧</div>
            <h2>Mas funciones muy pronto</h2>
            <p className="dashboard-copy">
              {user.role === 'concesionaria'
                ? 'La publicacion de inventario, citas de test drive y reportes de ventas llegan en los proximos sprints.'
                : 'La busqueda de vehiculos, el simulador de financiamiento y la agenda de test drive llegan en los proximos sprints.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
