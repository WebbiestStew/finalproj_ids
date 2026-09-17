import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      className="container"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '96px 24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '2.4rem' }}>🧭</span>
      <h1>Pagina no encontrada</h1>
      <p style={{ color: 'var(--text-muted)' }}>La ruta que buscas no existe o fue movida.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
