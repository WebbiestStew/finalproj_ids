const LABELS = {
  admin: 'Administrador',
  concesionaria: 'Concesionaria',
  comprador: 'Comprador',
};

export default function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{LABELS[role] || role}</span>;
}
