import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import CarScroll from '../components/CarScroll';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import VehicleCard from '../components/VehicleCard';
import './Landing.css';

const TILES = [
  {
    icon: 'shield',
    title: 'Cuentas y roles',
    text: 'Registro e inicio de sesión para compradores, concesionarias y administradores. Cada quien ve solo lo que le corresponde.',
    live: true,
    featured: true,
  },
  {
    icon: 'car',
    title: 'Catálogo de vehículos',
    text: 'Filtra por marca, precio y año. Cada concesionaria publica y actualiza sus propios autos.',
    live: true,
    to: '/catalogo',
  },
  { icon: 'pin', title: 'Sucursales cerca de ti', text: 'Encuentra el lote más cercano en un mapa interactivo.' },
  { icon: 'calculator', title: 'Simulador de financiamiento', text: 'Prueba enganches y plazos antes de ir a la agencia.' },
  { icon: 'calendar', title: 'Citas de prueba de manejo', text: 'Agenda tu test drive en la sucursal que más te quede.' },
  { icon: 'chart', title: 'Reportes de ventas', text: 'Ventas e inventario por mes, para decidir con datos.' },
];

const ROLES = [
  { icon: 'user', title: 'Compradores', text: 'Busca, compara y simula tu financiamiento sin salir de casa.' },
  { icon: 'store', title: 'Concesionarias', text: 'Publica tu inventario y atiende a compradores que ya llegan informados.' },
  { icon: 'shield', title: 'Administradores', text: 'Valida concesionarias y supervisa la operación de la plataforma.' },
];

export default function Landing() {
  usePageTitle();
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .listVehicles({ limit: 4, sort: 'recientes' })
      .then((data) => {
        if (!cancelled) setRecent(data.vehicles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-copy">
          <p className="hero-kicker">Compra y venta de autos</p>
          <h1 id="hero-title">Tu próximo auto, con el precio a la vista.</h1>
          <p className="hero-sub">
            DAuto reúne catálogo, historial y financiamiento de cada concesionaria en un solo lugar, para que compares sin
            llamarle a nadie.
          </p>
          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/catalogo" className="btn btn-primary">
                  Ver catálogo
                </Link>
                <Link to="/panel" className="btn btn-quiet">
                  Ir a mi panel <Icon name="chevron" size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/registro" className="btn btn-primary">
                  Crear cuenta
                </Link>
                <Link to="/catalogo" className="btn btn-secondary">
                  Ver catálogo
                </Link>
                <Link to="/iniciar-sesion" className="btn btn-quiet">
                  Iniciar sesión <Icon name="chevron" size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <CarScroll />

      {recent.length > 0 && (
        <section className="section section-recent" aria-labelledby="recent-title">
          <div className="container">
            <Reveal className="section-head">
              <h2 id="recent-title">Recién publicados.</h2>
              <p>Autos que las concesionarias acaban de subir al catálogo.</p>
            </Reveal>
            <div className="vehicle-grid">
              {recent.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
            <div className="section-cta">
              <Link to="/catalogo" className="btn btn-secondary">
                Ver todo el catálogo
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="alcance-title">
        <div className="container">
          <Reveal className="section-head">
            <h2 id="alcance-title">Todo lo que necesitas para decidir.</h2>
            <p>Ya funcionan las cuentas y el catálogo. El resto del alcance se construye por sprints y aparece aquí conforme esté listo.</p>
          </Reveal>

          <div className="tiles">
            {TILES.map((tile, i) => (
              <Reveal key={tile.title} className={`tile ${tile.featured ? 'tile-feature' : ''}`} delay={i * 50}>
                <Icon name={tile.icon} size={32} className="tile-icon" />
                <span className={`pill ${tile.live ? 'pill-live' : 'pill-soon'}`}>{tile.live ? 'Disponible' : 'Próximamente'}</span>
                <h3>{tile.title}</h3>
                <p>{tile.text}</p>
                {tile.to && (
                  <Link to={tile.to} className="tile-link">
                    Explorar <Icon name="chevron" size={16} />
                  </Link>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="roles-title">
        <div className="container">
          <Reveal className="section-head">
            <h2 id="roles-title">Pensado para cada quien.</h2>
          </Reveal>
          <div className="roles">
            {ROLES.map((role, i) => (
              <Reveal key={role.title} className="role" delay={i * 60}>
                <Icon name={role.icon} size={28} className="role-icon" />
                <h3>{role.title}</h3>
                <p>{role.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="section cta" aria-labelledby="cta-title">
          <Reveal className="container cta-inner">
            <h2 id="cta-title">Empieza en un minuto.</h2>
            <p>Crea tu cuenta de comprador o de concesionaria. Es gratis.</p>
            <Link to="/registro" className="btn btn-primary">
              Crear cuenta
            </Link>
          </Reveal>
        </section>
      )}
    </>
  );
}
