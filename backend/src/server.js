require('dotenv').config();
const { createApp } = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET no esta configurado. Define la variable de entorno antes de iniciar el servidor.');
  process.exit(1);
}

const { app } = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DAuto backend escuchando en el puerto ${PORT}`);
});
