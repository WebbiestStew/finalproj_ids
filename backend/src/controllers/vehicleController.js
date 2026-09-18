const { vehicleSchema, statusSchema, listQuerySchema } = require('../utils/validators');
const { validationError } = require('../utils/http');
const { PUBLIC_STATUSES } = require('../utils/vehicleOptions');

const NOT_FOUND = { error: 'Vehículo no encontrado' };

// Dealerships manage their own cars; admins can moderate any of them.
const canManage = (user, vehicle) => user.role === 'admin' || vehicle.dealer_id === user.sub;

function createVehicleController(vehicleModel) {
  // Loads :id and applies the ownership rule. Returns the vehicle, or sends the error and returns null.
  function loadManageable(req, res) {
    const vehicle = vehicleModel.findById(Number(req.params.id));
    if (!vehicle) {
      res.status(404).json(NOT_FOUND);
      return null;
    }
    if (!canManage(req.user, vehicle)) {
      res.status(403).json({ error: 'Solo puedes modificar los vehículos de tu concesionaria' });
      return null;
    }
    return vehicle;
  }

  function list(req, res) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed);

    const { rows, total } = vehicleModel.search({ ...parsed.data, statuses: PUBLIC_STATUSES });
    return res.status(200).json({ vehicles: rows, total, limit: parsed.data.limit, offset: parsed.data.offset });
  }

  function brands(req, res) {
    return res.status(200).json({ brands: vehicleModel.brands(PUBLIC_STATUSES) });
  }

  function get(req, res) {
    const vehicle = vehicleModel.findById(Number(req.params.id));
    return vehicle ? res.status(200).json({ vehicle }) : res.status(404).json(NOT_FOUND);
  }

  function mine(req, res) {
    return res.status(200).json({ vehicles: vehicleModel.listByDealer(req.user.sub) });
  }

  function create(req, res) {
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    return res.status(201).json({ vehicle: vehicleModel.create(req.user.sub, parsed.data) });
  }

  function update(req, res) {
    if (!loadManageable(req, res)) return undefined;

    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    return res.status(200).json({ vehicle: vehicleModel.update(Number(req.params.id), parsed.data) });
  }

  function updateStatus(req, res) {
    if (!loadManageable(req, res)) return undefined;

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    return res.status(200).json({ vehicle: vehicleModel.setStatus(Number(req.params.id), parsed.data.status) });
  }

  function remove(req, res) {
    if (!loadManageable(req, res)) return undefined;

    vehicleModel.remove(Number(req.params.id));
    return res.status(204).end();
  }

  return { list, brands, get, mine, create, update, updateStatus, remove };
}

module.exports = { createVehicleController };
