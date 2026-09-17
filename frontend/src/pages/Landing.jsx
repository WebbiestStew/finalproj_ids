import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const FEATURES = [
  {
    icon: '🔐',
    title: 'Registro y autenticacion',
    description: 'Cuentas separadas para compradores y concesionarias, con acceso por rol y JWT.',
    status: 'available',
  },
  {
    icon: '🚗',
    title: 'Catalogo de vehiculos',
    description: 'Ficha tecnica, fotos, precio, kilometraje y estado, publicados por cada concesionaria.',
    status: 'soon',
  },
  {
    icon: '📍',
    title: 'Geolocalizacion de sucursales',
    description: 'Encuentra el lote de autos y la sucursal mas cercana sobre un mapa interactivo.',
    status: 'soon',
  },
  {
    icon: '💳',
    title: 'Simulador de financiamiento',
    description: 'Compara enganche, plazos y tasa estimada antes de acudir a la sucursal.',
    status: 'soon',
  },
  {
    icon: '📅',
    title: 'Citas para test drive',
    description: 'Agenda una prueba de manejo en la sucursal mas cercana en unos clics.',
    status: 'soon',
  },
  {
    icon: '📊',
    title: 'Reportes de ventas e inventario',
    description: 'Metricas mensuales verificables para que cada concesionaria tome mejores decisiones.',
    status: 'soon',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <span className="eyebrow">Compra-venta de vehiculos, sin letras chiquitas</span>
          <h1>
            Encuentra tu proximo auto <span className="text-gradient">con total transparencia</span>
          </h1>
          <p className="hero-sub">
            DAuto conecta compradores y concesionarias en un solo lugar: precio real, historial
            del vehiculo y opciones de financiamiento claras, sin tener que recorrer sucursal por
            sucursal.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/panel" className="btn btn-primary">
                Ir a mi panel
              </Link>
            ) : (
              <>
                <Link to="/registro" className="btn btn-primary">
                  Crear cuenta gratis
                </Link>
                <Link to="/iniciar-sesion" className="btn btn-secondary">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container features">
        <div className="features-heading">
          <h2>Todo lo que necesitas para comprar o vender un auto</h2>
          <p>
            Este avance de proyecto ya incluye el modulo de autenticacion. El resto del alcance
            funcional esta planeado para los proximos sprints.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-top">
                <h3>{f.title}</h3>
                <span className={`pill pill-${f.status}`}>
                  {f.status === 'available' ? 'Disponible' : 'Proximamente'}
                </span>
              </div>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
