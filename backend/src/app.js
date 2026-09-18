const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { createDatabase } = require('./config/db');
const { UserModel } = require('./models/User');
const { VehicleModel } = require('./models/Vehicle');
const { createAuthController } = require('./controllers/authController');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createVehicleController } = require('./controllers/vehicleController');
const { createVehicleRoutes } = require('./routes/vehicleRoutes');

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Never answer with `Access-Control-Allow-Origin: *` (ZAP: Cross-Domain
// Misconfiguration). Explicit whitelist from the environment; in development
// fall back to the Vite dev server; in production with nothing configured,
// no cross-origin caller is allowed at all.
function resolveCorsOrigins() {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length) return configured;
  return process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS;
}

function createApp({ dbPath } = {}) {
  const db = createDatabase(dbPath);
  const userModel = new UserModel(db);
  const authController = createAuthController(userModel);
  const vehicleController = createVehicleController(new VehicleModel(db));

  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || true);

  app.use(helmet());
  app.use(cors({ origin: resolveCorsOrigins() }));

  // Auth responses carry tokens and personal data - nothing here may be cached
  // (ZAP: Storable and Cacheable Content).
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '10kb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT) || 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos, intenta de nuevo más tarde' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/', (req, res) =>
    res.status(200).json({ service: 'dauto-backend', status: 'ok', docs: '/health' })
  );
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', createAuthRoutes(authController));
  app.use('/api/vehicles', createVehicleRoutes(vehicleController));

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return { app, db };
}

module.exports = { createApp, resolveCorsOrigins };
