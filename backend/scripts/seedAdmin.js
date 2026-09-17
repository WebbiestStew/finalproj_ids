require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createDatabase } = require('../src/config/db');
const { UserModel } = require('../src/models/User');

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Uso: node scripts/seedAdmin.js "<nombre>" <email> <password>');
  process.exit(1);
}

const db = createDatabase();
const userModel = new UserModel(db);

if (userModel.findByEmail(email)) {
  console.error(`Ya existe un usuario con el correo ${email}`);
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 12);
const admin = userModel.create({ name, email, passwordHash, role: 'admin' });

console.log(`Administrador creado: ${admin.email} (id=${admin.id})`);
