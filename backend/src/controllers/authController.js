const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../utils/validators');
const { validationError } = require('../utils/http');

const DEFAULT_ROUNDS = 12;
const PRODUCTION_MIN_ROUNDS = 10; // OWASP: minimum work factor for bcrypt

// Work factor is tunable (BCRYPT_ROUNDS) because it is the main throughput limit
// of the auth module: each step doubles the cost of every login. It can be lowered
// for tests, but never below the OWASP minimum in production.
function resolveRounds(env = process.env) {
  const requested = Number(env.BCRYPT_ROUNDS) || DEFAULT_ROUNDS;
  return env.NODE_ENV === 'production' ? Math.max(PRODUCTION_MIN_ROUNDS, requested) : requested;
}

const SALT_ROUNDS = resolveRounds();
const TOKEN_TTL = '2h';
const JWT_ALGORITHM = 'HS256';

// Compared against when the email doesn't exist so a missing account takes as
// long to answer as a wrong password (prevents account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('dauto-timing-equalizer', SALT_ROUNDS);

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL, algorithm: JWT_ALGORITHM }
  );
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function createAuthController(userModel) {
  async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const { name, email, password, role } = parsed.data;

    if (userModel.findByEmail(email)) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = userModel.create({ name, email, passwordHash, role });

    return res.status(201).json({ user: toPublicUser(user), token: signToken(user) });
  }

  async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    const { email, password } = parsed.data;
    const user = userModel.findByEmail(email);
    const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    return res.status(200).json({ user: toPublicUser(user), token: signToken(user) });
  }

  function me(req, res) {
    const user = userModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json({ user: toPublicUser(user) });
  }

  function listUsers(req, res) {
    return res.status(200).json({ users: userModel.list() });
  }

  return { register, login, me, listUsers };
}

module.exports = { createAuthController, resolveRounds };
