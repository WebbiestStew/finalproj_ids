const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

// Express 4 doesn't forward rejected promises to the error handler on its own.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createAuthRoutes(authController) {
  const router = Router();

  router.post('/register', asyncHandler(authController.register));
  router.post('/login', asyncHandler(authController.login));
  router.get('/me', authenticate, authController.me);
  router.get('/users', authenticate, requireRole('admin'), authController.listUsers);

  return router;
}

module.exports = { createAuthRoutes };
