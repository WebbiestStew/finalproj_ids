import './PageLoader.css';

export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-ring" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
