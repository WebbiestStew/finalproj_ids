import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { usePageTitle } from '../hooks/usePageTitle';
import CarArt from '../components/CarArt';
import Icon from '../components/Icon';
import { formatKm, formatPrice } from '../utils/format';
import { STATUS_LABELS } from '../utils/vehicleOptions';
import './VehicleDetail.css';

export default function VehicleDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ id: null, status: 'loading', vehicle: null, error: '' });
  const loading = state.id !== id;
  const vehicle = loading ? null : state.vehicle;
  usePageTitle(vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : 'Catálogo');

  useEffect(() => {
    let cancelled = false;
    api
      .getVehicle(id)
      .then((data) => {
        if (!cancelled) setState({ id, status: 'ready', vehicle: data.vehicle, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ id, status: 'error', vehicle: null, error: err.status === 404 ? 'Este vehículo no existe o ya no está publicado.' : err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const back = (
    <Link to="/catalogo" className="back-link">
      <Icon name="chevron" size={16} className="back-icon" /> Catálogo
    </Link>
  );

  if (loading) {
    return (
      <div className="container detail" aria-busy="true">
        {back}
        <div className="detail-grid">
          <div className="detail-art">
            <span className="skeleton" style={{ width: '70%', height: '6rem' }} />
          </div>
          <div className="detail-body">
            <span className="skeleton" style={{ width: '60%', height: '2rem' }} />
            <span className="skeleton" style={{ width: '40%', height: '1.5rem' }} />
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container detail">
        {back}
        <div className="empty">
          <Icon name="car" size={36} className="empty-icon" />
          <h1 className="empty-title">{state.error}</h1>
          <Link to="/catalogo" className="btn btn-primary">
            Ver el catálogo
          </Link>
        </div>
      </div>
    );
  }

  const specs = [
    ['Año', vehicle.year],
    ['Kilometraje', formatKm(vehicle.mileage)],
    ['Carrocería', vehicle.body],
    ['Transmisión', vehicle.transmission],
    ['Combustible', vehicle.fuel],
    ['Color', vehicle.color],
  ];

  return (
    <div className="container detail">
      {back}

      <div className="detail-grid">
        <div className="detail-art">
          <CarArt body={vehicle.body} color={vehicle.color} />
          <p className="detail-art-note">Ilustración referencial · las fotos reales llegan más adelante</p>
        </div>

        <div className="detail-body">
          <p className="detail-dealer">{vehicle.dealer_name}</p>
          <h1>
            {vehicle.brand} {vehicle.model}
          </h1>
          <p className="detail-price">{formatPrice(vehicle.price)}</p>
          <span className={`pill pill-status pill-${vehicle.status}`}>{STATUS_LABELS[vehicle.status]}</span>

          <dl className="list detail-specs">
            {specs.map(([label, value]) => (
              <div className="list-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {vehicle.description && (
            <section aria-labelledby="desc-title" className="detail-desc">
              <h2 id="desc-title">Descripción</h2>
              <p>{vehicle.description}</p>
            </section>
          )}

          <p className="detail-next">El simulador de financiamiento y las citas de prueba de manejo llegan en los próximos sprints.</p>
        </div>
      </div>
    </div>
  );
}
