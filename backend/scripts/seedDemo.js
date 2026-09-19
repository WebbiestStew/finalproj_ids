require('dotenv').config();
const { createDatabase } = require('../src/config/db');
const { seedDemo } = require('../src/seed/demo');

// Local convenience: the demo dealerships get a known password so you can sign in as them.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo-password-123';

const result = seedDemo(createDatabase(), { password: DEMO_PASSWORD });

console.log(
  result.added ? `Se agregaron ${result.added} vehículos demo.` : `Ya hay ${result.existing} vehículos demo; no se agregó nada.`
);
console.log(`Concesionarias demo: ${result.dealers.join(', ')} (contraseña: ${DEMO_PASSWORD})`);
