import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PageLoader from './PageLoader';

// Login/register make no sense for someone who's already signed in.
export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/panel" replace />;
  return children;
}
