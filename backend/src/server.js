require('dotenv').config();
const { createApp } = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET no está configurado. Defínelo como variable de entorno antes de iniciar el servidor.');
  process.exit(1);
}

const { app, db } = createApp();
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`DAuto backend escuchando en el puerto ${PORT}`);
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
