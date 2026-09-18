import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PageLoader from './PageLoader';

// `roles` limits a route to some account types; anyone else is sent to their panel.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/panel" replace />;
  return children;
}
