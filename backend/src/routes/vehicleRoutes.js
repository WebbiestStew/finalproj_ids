const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

function createVehicleRoutes(vehicleController) {
  const router = Router();
  const dealer = [authenticate, requireRole('concesionaria')];
  const manage = [authenticate, requireRole('concesionaria', 'admin')];

  // Public catalog. Fixed paths must come before '/:id'.
  router.get('/', vehicleController.list);
  router.get('/brands', vehicleController.brands);
  router.get('/mine', ...dealer, vehicleController.mine);
  router.get('/:id', vehicleController.get);

  router.post('/', ...dealer, vehicleController.create);
  router.put('/:id', ...manage, vehicleController.update);
  router.patch('/:id/status', ...manage, vehicleController.updateStatus);
  router.delete('/:id', ...manage, vehicleController.remove);

  return router;
}

module.exports = { createVehicleRoutes };
