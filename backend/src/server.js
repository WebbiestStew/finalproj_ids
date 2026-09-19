require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { bootstrap } = require('./bootstrap');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET no está configurado. Ejecuta `npm run setup` en la raíz del proyecto (lo genera por ti) o defínelo como variable de entorno.');
  process.exit(1);
}

// STATIC_DIR wins; otherwise serve frontend/dist when it has been built, so
// `npm run build && npm start` runs the whole app on one port.
const builtFrontend = path.join(__dirname, '..', '..', 'frontend', 'dist');
const staticDir = process.env.STATIC_DIR || (fs.existsSync(path.join(builtFrontend, 'index.html')) ? builtFrontend : undefined);

const { app, db } = createApp({ staticDir });
bootstrap(db);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  const frontendNote = staticDir ? ` (sirviendo el frontend desde ${staticDir})` : '';
  console.log(`DAuto escuchando en el puerto ${PORT}${frontendNote}`);
});

function shutdown(signal) {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
