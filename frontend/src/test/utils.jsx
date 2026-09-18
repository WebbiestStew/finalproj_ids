import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

export const TOKEN_KEY = 'dauto.token';

export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

// Renders `ui` at `path` inside the real router + auth provider. Extra routes let
// a test observe where a redirect landed.
export function renderApp(ui, { path = '/', routePath = path.split('?')[0], routes = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={routePath} element={ui} />
          {Object.entries(routes).map(([route, element]) => (
            <Route key={route} path={route} element={element} />
          ))}
        </Routes>
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>
  );
}

export const USERS = {
  comprador: { id: 2, name: 'María López', email: 'maria@example.com', role: 'comprador' },
  admin: { id: 1, name: 'Admin DAuto', email: 'admin@dauto.com', role: 'admin' },
  concesionaria: { id: 3, name: 'Autos del Norte', email: 'norte@example.com', role: 'concesionaria' },
};

export const makeVehicle = (overrides = {}) => ({
  id: 1,
  dealer_id: 3,
  dealer_name: 'Autos del Norte',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
  price: 329900,
  mileage: 42000,
  color: 'Blanco',
  transmission: 'Automática',
  fuel: 'Gasolina',
  body: 'Sedán',
  description: 'Único dueño',
  status: 'disponible',
  created_at: '2026-09-18 10:00:00',
  ...overrides,
});
