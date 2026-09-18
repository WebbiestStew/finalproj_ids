import { Link } from 'react-router-dom';
import CarArt from './CarArt';
import { formatKm, formatPrice } from '../utils/format';
import './VehicleCard.css';

export default function VehicleCard({ vehicle }) {
  const { id, brand, model, year, mileage, transmission, price, body, color, status, dealer_name: dealer } = vehicle;

  return (
    <Link to={`/catalogo/${id}`} className="vehicle-card">
      <div className="vehicle-art">
        <CarArt body={body} color={color} />
        {status === 'apartado' && <span className="pill pill-hold">Apartado</span>}
      </div>
      <div className="vehicle-info">
        <h3>
          {brand} {model}
        </h3>
        <p className="vehicle-meta">
          {year} · {formatKm(mileage)} · {transmission}
        </p>
        <p className="vehicle-price">{formatPrice(price)}</p>
        <p className="vehicle-dealer">{dealer}</p>
      </div>
    </Link>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="vehicle-card vehicle-card-skeleton" aria-hidden="true">
      <div className="vehicle-art">
        <span className="skeleton" style={{ width: '70%', height: '4rem' }} />
      </div>
      <div className="vehicle-info">
        <span className="skeleton" style={{ width: '60%', height: '1.1rem' }} />
        <span className="skeleton" style={{ width: '85%' }} />
        <span className="skeleton" style={{ width: '40%', height: '1.25rem' }} />
      </div>
    </div>
  );
}
