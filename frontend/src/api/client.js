// Same origin by default: in production the backend serves this app, and in development
// Vite proxies /api to it (see vite.config.js), so there is no CORS to configure.
// Set VITE_API_URL only when the API lives on a different domain than the frontend.
const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const NETWORK_ERROR = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const UNKNOWN_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = Array.isArray(data?.error) ? data.error.join(' ') : data?.error || UNKNOWN_ERROR;
    throw new ApiError(message, res.status);
  }

  return data;
}

// Builds ?a=1&b=2 from an object, skipping empty values.
function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),
  listUsers: (token) => request('/api/auth/users', { token }),

  listVehicles: (params) => request(`/api/vehicles${toQuery(params)}`),
  vehicleBrands: () => request('/api/vehicles/brands'),
  getVehicle: (id) => request(`/api/vehicles/${id}`),
  myVehicles: (token) => request('/api/vehicles/mine', { token }),
  createVehicle: (token, body) => request('/api/vehicles', { method: 'POST', body, token }),
  updateVehicle: (token, id, body) => request(`/api/vehicles/${id}`, { method: 'PUT', body, token }),
  setVehicleStatus: (token, id, status) => request(`/api/vehicles/${id}/status`, { method: 'PATCH', body: { status }, token }),
  deleteVehicle: (token, id) => request(`/api/vehicles/${id}`, { method: 'DELETE', token }),
};
