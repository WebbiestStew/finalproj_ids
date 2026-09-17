const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../utils/validators');

const SALT_ROUNDS = 12;
const TOKEN_TTL = '2h';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function createAuthController(userModel) {
  function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message) });
    }

    const { name, email, password, role } = parsed.data;

    if (userModel.findByEmail(email)) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const user = userModel.create({ name, email, passwordHash, role });
    const token = signToken(user);

    return res.status(201).json({ user: toPublicUser(user), token });
  }

  function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message) });
    }

    const { email, password } = parsed.data;
    const user = userModel.findByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = signToken(user);
    return res.status(200).json({ user: toPublicUser(user), token });
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

module.exports = { createAuthController };
