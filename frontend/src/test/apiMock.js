import { vi } from 'vitest';

// Kept free of app imports on purpose: it runs inside vi.mock factories, and importing
// anything that itself imports the mocked module creates a circular import.
export const apiMock = () => ({
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
  listUsers: vi.fn(),
  listVehicles: vi.fn(async () => ({ vehicles: [], total: 0 })),
  vehicleBrands: vi.fn(async () => ({ brands: [] })),
  getVehicle: vi.fn(),
  myVehicles: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  setVehicleStatus: vi.fn(),
  deleteVehicle: vi.fn(),
});
