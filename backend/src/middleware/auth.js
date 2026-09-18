const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticación faltante' });
  }

  try {
    // Pinning the algorithm closes the classic "alg: none / algorithm confusion" hole.
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
