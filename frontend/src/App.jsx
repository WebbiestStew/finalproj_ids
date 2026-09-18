import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import VehicleDetail from './pages/VehicleDetail';
import Inventory from './pages/Inventory';
import VehicleForm from './pages/VehicleForm';
import NotFound from './pages/NotFound';

// Critically damped (bounce: 0): a route change isn't a momentum gesture, so it
// settles instead of overshooting. Reduced motion swaps the shift for a fade.
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const REDUCED_MOTION_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function AnimatedRoutes() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? REDUCED_MOTION_VARIANTS : PAGE_VARIANTS;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={prefersReducedMotion ? { duration: 0.12 } : { type: 'spring', bounce: 0, duration: 0.32 }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/iniciar-sesion"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/panel"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/catalogo/:id" element={<VehicleDetail />} />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute roles={['concesionaria']}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/nuevo"
            element={
              <ProtectedRoute roles={['concesionaria']}>
                <VehicleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/:id/editar"
            element={
              <ProtectedRoute roles={['concesionaria']}>
                <VehicleForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <Navbar />
        <main id="main" tabIndex={-1}>
          <AnimatedRoutes />
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
