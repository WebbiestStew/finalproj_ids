const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { UserModel } = require('../models/User');
const { VehicleModel } = require('../models/Vehicle');

// Demo dealerships and cars so the catalog isn't empty on a fresh database.
// Idempotent: it only inserts what is missing and never touches other data.
const DEALERS = [
  { name: 'Autos del Norte', email: 'contacto@autosnorte.com' },
  { name: 'Motores Monterrey', email: 'ventas@motoresmty.com' },
];

const [AUTO, MANUAL, GAS, HYBRID, SUV, SEDAN, HATCH] = ['Automática', 'Manual', 'Gasolina', 'Híbrido', 'SUV', 'Sedán', 'Hatchback'];

// [dealer index, brand, model, year, price, mileage, color, transmission, fuel, body, description]
const CARS = [
  [0, 'Toyota', 'Corolla', 2021, 329900, 42000, 'Blanco', AUTO, GAS, SEDAN, 'Único dueño, servicios de agencia y llantas nuevas.'],
  [0, 'Nissan', 'Versa', 2020, 214900, 58000, 'Plata', MANUAL, GAS, SEDAN, 'Económico y confiable, ideal para la ciudad.'],
  [1, 'Mazda', 'Mazda3', 2019, 289000, 67000, 'Rojo', AUTO, GAS, HATCH, 'Versión Grand Touring con pantalla y cámara de reversa.'],
  [1, 'Volkswagen', 'Jetta', 2018, 239500, 81000, 'Gris', AUTO, GAS, SEDAN, 'Mantenimiento al corriente, sin choques.'],
  [0, 'Kia', 'Rio Hatchback', 2022, 312000, 23000, 'Azul', MANUAL, GAS, HATCH, 'Casi nuevo, garantía de fábrica vigente.'],
  [1, 'Honda', 'CR-V', 2020, 489000, 54000, 'Negro', AUTO, GAS, SUV, 'Tres filas de asientos, todos los servicios en agencia.'],
  [0, 'Toyota', 'RAV4 Hybrid', 2022, 689000, 28000, 'Blanco', AUTO, HYBRID, SUV, 'Rendimiento excepcional de combustible.'],
  [1, 'Hyundai', 'Tucson', 2020, 419900, 61000, 'Verde', AUTO, GAS, SUV, 'Piel, quemacocos y asistente de carril.'],
  [0, 'Nissan', 'Kicks', 2021, 359000, 39000, 'Naranja', AUTO, GAS, SUV, 'Techo en contraste y sensores de estacionamiento.'],
  [1, 'Tesla', 'Model 3', 2021, 749000, 35000, 'Negro', AUTO, 'Eléctrico', SEDAN, 'Autonomía extendida, carga en casa incluida.'],
  [0, 'Chevrolet', 'Aveo', 2017, 149000, 96000, 'Café', MANUAL, GAS, SEDAN, 'Perfecto como primer auto.'],
  [1, 'Mazda', 'CX-5', 2022, 569000, 19000, 'Gris', AUTO, GAS, SUV, 'Signature con techo panorámico.'],
];

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ password?: string }} options
 *   password: login password for the demo dealerships. Without one they get a random
 *   unguessable password, i.e. they own the demo cars but nobody can sign in as them —
 *   the safe default for anything that is publicly reachable.
 */
function seedDemo(db, { password } = {}) {
  const users = new UserModel(db);
  const vehicles = new VehicleModel(db);

  const secret = password || crypto.randomBytes(24).toString('hex');
  const passwordHash = bcrypt.hashSync(secret, 10);

  const dealerIds = DEALERS.map(({ name, email }) => {
    const existing = users.findByEmail(email);
    return existing ? existing.id : users.create({ name, email, passwordHash, role: 'concesionaria' }).id;
  });

  const existing = db.prepare('SELECT COUNT(*) AS n FROM vehicles WHERE dealer_id IN (?, ?)').get(...dealerIds).n;
  if (existing > 0) return { added: 0, existing, dealers: DEALERS.map((d) => d.email), loginEnabled: Boolean(password) };

  CARS.forEach(([dealer, brand, model, year, price, mileage, color, transmission, fuel, body, description]) => {
    vehicles.create(dealerIds[dealer], { brand, model, year, price, mileage, color, transmission, fuel, body, description });
  });

  return { added: CARS.length, existing: 0, dealers: DEALERS.map((d) => d.email), loginEnabled: Boolean(password) };
}

module.exports = { seedDemo, DEALERS, CARS };
