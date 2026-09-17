require('./setup');
const jwt = require('jsonwebtoken');
const { authenticate, requireRole } = require('../src/middleware/auth');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('middleware/auth', () => {
  describe('authenticate', () => {
    it('adjunta el payload decodificado a req.user cuando el token es valido', () => {
      const token = jwt.sign({ sub: 1, role: 'comprador' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.sub).toBe(1);
    });

    it('rechaza cuando no hay encabezado de autorizacion', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe('requireRole', () => {
    it('rechaza cuando no hay usuario autenticado en la request', () => {
      const req = {};
      const res = mockRes();
      const next = jest.fn();

      requireRole('admin')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
    });

    it('permite el paso cuando el rol coincide', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();

      requireRole('admin', 'concesionaria')(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
