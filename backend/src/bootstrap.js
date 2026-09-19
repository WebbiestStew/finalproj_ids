const bcrypt = require('bcryptjs');
const { UserModel } = require('./models/User');
const { seedDemo } = require('./seed/demo');

const MIN_ADMIN_PASSWORD = 10;
const ADMIN_ROUNDS = 12;

// Startup tasks driven by environment variables, so a hosted deployment (where there
// is no shell to run scripts in) can still get its first admin and some demo data.
//   ADMIN_EMAIL + ADMIN_PASSWORD  create that admin if it doesn't exist yet
//   SEED_DEMO=true                add demo dealerships and cars if missing
//   DEMO_PASSWORD                 (optional) lets you sign in as the demo dealerships
// Everything is idempotent: restarting never duplicates or overwrites anything.
function bootstrap(db, env = process.env, log = console) {
  const summary = { admin: 'skipped', demo: 'skipped' };
  const users = new UserModel(db);

  const email = (env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = env.ADMIN_PASSWORD || '';

  if (email || password) {
    if (!email || !password) {
      log.warn('ADMIN_EMAIL y ADMIN_PASSWORD deben definirse juntos; no se creó el administrador.');
      summary.admin = 'incomplete';
    } else if (password.length < MIN_ADMIN_PASSWORD) {
      log.warn(`ADMIN_PASSWORD debe tener al menos ${MIN_ADMIN_PASSWORD} caracteres; no se creó el administrador.`);
      summary.admin = 'weak-password';
    } else if (users.findByEmail(email)) {
      summary.admin = 'exists';
    } else {
      users.create({ name: 'Administrador', email, passwordHash: bcrypt.hashSync(password, ADMIN_ROUNDS), role: 'admin' });
      log.log(`Administrador creado: ${email}`);
      summary.admin = 'created';
    }
  }

  if (env.SEED_DEMO === 'true') {
    const result = seedDemo(db, { password: env.DEMO_PASSWORD });
    log.log(result.added ? `Datos demo agregados: ${result.added} vehículos.` : 'Datos demo ya presentes; no se agregó nada.');
    summary.demo = result.added ? 'added' : 'present';
  }

  return summary;
}

module.exports = { bootstrap, MIN_ADMIN_PASSWORD };
