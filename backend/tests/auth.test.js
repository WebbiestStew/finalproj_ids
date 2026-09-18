require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');
const { UserModel } = require('../src/models/User');
const bcrypt = require('bcryptjs');

const REGISTER_PATH = '/api/auth/register';
const LOGIN_PATH = '/api/auth/login';
const ME_PATH = '/api/auth/me';
const USERS_PATH = '/api/auth/users';
const AUTH_HEADER = 'Authorization';

describe('Auth module (registro, login, roles)', () => {
  let app;
  let db;

  beforeEach(() => {
    ({ app, db } = createApp({ dbPath: ':memory:' }));
  });

  afterEach(() => {
    db.close();
  });

  const comprador = {
    name: 'Ana Comprador',
    email: 'ana@example.com',
    password: 'password123',
    role: 'comprador',
  };

  describe('POST /api/auth/register', () => {
    it('registra un comprador valido y devuelve token', async () => {
      const res = await request(app).post(REGISTER_PATH).send(comprador);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(comprador.email);
      expect(res.body.user.role).toBe('comprador');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('registra una concesionaria valida', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...comprador, email: 'concesionaria@example.com', role: 'concesionaria' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('concesionaria');
    });

    it('rechaza un correo invalido', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...comprador, email: 'no-es-un-correo' });

      expect(res.status).toBe(400);
    });

    it('rechaza una contrasena corta', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...comprador, password: '123' });

      expect(res.status).toBe(400);
    });

    it('rechaza un rol no permitido (no se puede auto-asignar admin)', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...comprador, role: 'admin' });

      expect(res.status).toBe(400);
    });

    it('rechaza correos duplicados', async () => {
      await request(app).post(REGISTER_PATH).send(comprador);
      const res = await request(app).post(REGISTER_PATH).send(comprador);

      expect(res.status).toBe(409);
    });

    it('rechaza un payload de XSS almacenado en el nombre', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...comprador, email: 'xss@example.com', name: '<script>alert(1)</script>' });

      expect(res.status).toBe(400);
    });

    it('no ejecuta ni almacena payloads de inyeccion SQL como texto plano (prepared statements)', async () => {
      const injection = { ...comprador, email: 'sqli@example.com', name: "Robert'); DROP TABLE users;--" };
      const res = await request(app).post(REGISTER_PATH).send(injection);

      expect(res.status).toBe(201);

      const userModel = new UserModel(db);
      expect(userModel.findByEmail('sqli@example.com')).toBeDefined();
      expect(userModel.list().length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post(REGISTER_PATH).send(comprador);
    });

    it('autentica con credenciales correctas', async () => {
      const res = await request(app)
        .post(LOGIN_PATH)
        .send({ email: comprador.email, password: comprador.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rechaza contrasena incorrecta', async () => {
      const res = await request(app)
        .post(LOGIN_PATH)
        .send({ email: comprador.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('rechaza un correo que no existe', async () => {
      const res = await request(app)
        .post(LOGIN_PATH)
        .send({ email: 'nadie@example.com', password: comprador.password });

      expect(res.status).toBe(401);
    });

    it('rechaza body invalido', async () => {
      const res = await request(app).post(LOGIN_PATH).send({ email: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rechaza peticiones sin token', async () => {
      const res = await request(app).get(ME_PATH);
      expect(res.status).toBe(401);
    });

    it('rechaza un token malformado', async () => {
      const res = await request(app).get(ME_PATH).set(AUTH_HEADER, 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('rechaza un esquema de autorizacion distinto de Bearer', async () => {
      const res = await request(app).get(ME_PATH).set(AUTH_HEADER, 'Basic abc123');
      expect(res.status).toBe(401);
    });

    it('devuelve el perfil del usuario autenticado', async () => {
      const registerRes = await request(app).post(REGISTER_PATH).send(comprador);
      const { token } = registerRes.body;

      const res = await request(app).get(ME_PATH).set(AUTH_HEADER, `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(comprador.email);
    });
  });

  describe('GET /api/auth/users (solo admin)', () => {
    it('rechaza a un comprador autenticado sin rol admin', async () => {
      const registerRes = await request(app).post(REGISTER_PATH).send(comprador);
      const { token } = registerRes.body;

      const res = await request(app).get(USERS_PATH).set(AUTH_HEADER, `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('permite a un admin listar usuarios', async () => {
      const userModel = new UserModel(db);
      const admin = userModel.create({
        name: 'Admin DAuto',
        email: 'admin@example.com',
        passwordHash: bcrypt.hashSync('adminpass123', 4),
        role: 'admin',
      });

      const loginRes = await request(app)
        .post(LOGIN_PATH)
        .send({ email: admin.email, password: 'adminpass123' });

      const res = await request(app)
        .get(USERS_PATH)
        .set(AUTH_HEADER, `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('Rutas generales', () => {
    it('responde 200 en la raiz (para spiders/health checks externos)', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });

    it('responde 200 en /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('responde 404 en una ruta desconocida', async () => {
      const res = await request(app).get('/api/no-existe');
      expect(res.status).toBe(404);
    });
  });
});
