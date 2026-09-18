import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import CarArt from '../components/CarArt';
import Icon from '../components/Icon';
import { formatKm, formatPrice } from '../utils/format';
import { STATUS_LABELS } from '../utils/vehicleOptions';
import './Inventory.css';

export default function Inventory() {
  usePageTitle('Mi inventario');
  const { token, logout } = useAuth();
  const [state, setState] = useState({ status: 'loading', vehicles: [], error: '' });
  const [actionError, setActionError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .myVehicles(token)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', vehicles: data.vehicles, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) logout();
        else setState({ status: 'error', vehicles: [], error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const changeStatus = async (vehicle, status) => {
    setActionError('');
    setBusyId(vehicle.id);
    try {
      const data = await api.setVehicleStatus(token, vehicle.id, status);
      setState((prev) => ({ ...prev, vehicles: prev.vehicles.map((v) => (v.id === vehicle.id ? data.vehicle : v)) }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (vehicle) => {
    setActionError('');
    setBusyId(vehicle.id);
    try {
      await api.deleteVehicle(token, vehicle.id);
      setState((prev) => ({ ...prev, vehicles: prev.vehicles.filter((v) => v.id !== vehicle.id) }));
      setConfirmingId(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const { status, vehicles, error } = state;
  const listed = vehicles.filter((v) => v.status !== 'vendido').length;

  return (
    <div className="container inventory">
      <header className="inventory-head">
        <div>
          <p className="dash-kicker">Concesionaria</p>
          <h1>Mi inventario</h1>
          <p className="inventory-sub">
            {status === 'ready' && vehicles.length > 0
              ? `${listed} publicados en el catálogo · ${vehicles.length - listed} vendidos`
              : 'Publica tus autos y mantén su estado al día.'}
          </p>
        </div>
        <Link to="/inventario/nuevo" className="btn btn-primary">
          <Icon name="plus" size={18} /> Publicar vehículo
        </Link>
      </header>

      {(error || actionError) && (
        <p className="alert alert-error" role="alert">
          <Icon name="alert" size={18} />
          <span>{error || actionError}</span>
        </p>
      )}

      {status === 'loading' && (
        <div className="list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div className="inventory-row" key={i}>
              <span className="skeleton" style={{ width: '100%', height: '2.5rem' }} />
            </div>
          ))}
        </div>
      )}

      {status === 'ready' && vehicles.length === 0 && (
        <div className="empty">
          <Icon name="car" size={36} className="empty-icon" />
          <h2>Aún no has publicado autos</h2>
          <p>Tu primer vehículo aparecerá en el catálogo en cuanto lo publiques.</p>
          <Link to="/inventario/nuevo" className="btn btn-primary">
            Publicar mi primer auto
          </Link>
        </div>
      )}

      {vehicles.length > 0 && (
        <ul className="list inventory-list">
          {vehicles.map((v) => (
            <li className="inventory-row" key={v.id}>
              <div className="inventory-art">
                <CarArt body={v.body} color={v.color} />
              </div>

              <div className="inventory-main">
                <Link to={`/catalogo/${v.id}`} className="inventory-title">
                  {v.brand} {v.model} {v.year}
                </Link>
                <p>
                  {formatPrice(v.price)} · {formatKm(v.mileage)}
                </p>
              </div>

              <div className="inventory-actions">
                {confirmingId === v.id ? (
                  <div className="confirm" role="group" aria-label={`Confirmar eliminación de ${v.brand} ${v.model}`}>
                    <span>¿Eliminar este auto?</span>
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmingId(null)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(v)} disabled={busyId === v.id}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="sr-only" htmlFor={`status-${v.id}`}>
                      Estado de {v.brand} {v.model}
                    </label>
                    <select
                      id={`status-${v.id}`}
                      className={`status-select status-${v.status}`}
                      value={v.status}
                      disabled={busyId === v.id}
                      onChange={(e) => changeStatus(v, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Link to={`/inventario/${v.id}/editar`} className="btn btn-secondary btn-sm">
                      Editar
                    </Link>
                    <button type="button" className="btn btn-quiet btn-sm btn-quiet-danger" onClick={() => setConfirmingId(v.id)}>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
