const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { createDatabase } = require('./config/db');
const { UserModel } = require('./models/User');
const { createAuthController } = require('./controllers/authController');
const { createAuthRoutes } = require('./routes/authRoutes');

function createApp({ dbPath } = {}) {
  const db = createDatabase(dbPath);
  const userModel = new UserModel(db);
  const authController = createAuthController(userModel);

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
  app.use(express.json({ limit: '10kb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos, intenta de nuevo mas tarde' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/', (req, res) =>
    res.status(200).json({ service: 'dauto-backend', status: 'ok', docs: '/health' })
  );
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', createAuthRoutes(authController));

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return { app, db };
}

module.exports = { createApp };
