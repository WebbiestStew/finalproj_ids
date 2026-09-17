const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

function createAuthRoutes(authController) {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.get('/me', authenticate, authController.me);
  router.get('/users', authenticate, requireRole('admin'), authController.listUsers);

  return router;
}

module.exports = { createAuthRoutes };
