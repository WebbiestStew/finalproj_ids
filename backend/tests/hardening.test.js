require('./setup');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp, resolveCorsOrigins } = require('../src/app');
const { resolveRounds } = require('../src/controllers/authController');

const REGISTER_PATH = '/api/auth/register';
const LOGIN_PATH = '/api/auth/login';
const HEALTH_PATH = '/health';
const ORIGIN_HEADER = 'Origin';
const ACAO_HEADER = 'access-control-allow-origin';
const DEV_ORIGIN = 'http://localhost:5173';
const ME_PATH = '/api/auth/me';
const VALID_USER = {
  name: 'Luis Prueba',
  email: 'luis@example.com',
  password: 'password123',
  role: 'comprador',
};

describe('hardening (hallazgos de ZAP y revisión de seguridad)', () => {
  let app;
  let db;

  beforeEach(() => {
    ({ app, db } = createApp({ dbPath: ':memory:' }));
  });

  afterEach(() => {
    db.close();
  });

  describe('cabeceras', () => {
    it('marca todas las respuestas como no almacenables en caché', async () => {
      const res = await request(app).get(HEALTH_PATH);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('también aplica no-store en respuestas 404', async () => {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(404);
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('nunca responde con Access-Control-Allow-Origin comodín', async () => {
      const res = await request(app).get(HEALTH_PATH).set(ORIGIN_HEADER, 'https://evil.example');
      expect(res.headers[ACAO_HEADER]).not.toBe('*');
      expect(res.headers[ACAO_HEADER]).toBeUndefined();
    });

    it('permite el origen del servidor de desarrollo', async () => {
      const res = await request(app).get(HEALTH_PATH).set(ORIGIN_HEADER, DEV_ORIGIN);
      expect(res.headers[ACAO_HEADER]).toBe(DEV_ORIGIN);
    });
  });

  describe('resolveCorsOrigins', () => {
    const original = { ...process.env };
    afterEach(() => {
      process.env = { ...original };
    });

    it('usa la lista de CORS_ORIGINS cuando está definida', () => {
      process.env.CORS_ORIGINS = 'https://a.com, https://b.com';
      expect(resolveCorsOrigins()).toEqual(['https://a.com', 'https://b.com']);
    });

    it('en producción sin configuración no permite ningún origen', () => {
      delete process.env.CORS_ORIGINS;
      process.env.NODE_ENV = 'production';
      expect(resolveCorsOrigins()).toEqual([]);
    });

    it('en desarrollo sin configuración permite solo localhost:5173', () => {
      delete process.env.CORS_ORIGINS;
      process.env.NODE_ENV = 'test';
      expect(resolveCorsOrigins()).toContain(DEV_ORIGIN);
    });
  });

  describe('resolveRounds (factor de trabajo de bcrypt)', () => {
    it('usa 12 por defecto', () => {
      expect(resolveRounds({})).toBe(12);
    });

    it('respeta BCRYPT_ROUNDS fuera de producción', () => {
      expect(resolveRounds({ BCRYPT_ROUNDS: '4' })).toBe(4);
    });

    it('en producción nunca baja del mínimo de OWASP (10)', () => {
      expect(resolveRounds({ NODE_ENV: 'production', BCRYPT_ROUNDS: '4' })).toBe(10);
      expect(resolveRounds({ NODE_ENV: 'production', BCRYPT_ROUNDS: '13' })).toBe(13);
    });
  });

  describe('TRUST_PROXY', () => {
    afterEach(() => {
      delete process.env.TRUST_PROXY;
    });

    it('activa trust proxy solo cuando la variable está definida', () => {
      process.env.TRUST_PROXY = '1';
      const { app: proxied, db: proxiedDb } = createApp({ dbPath: ':memory:' });
      expect(proxied.get('trust proxy')).toBe(1);
      proxiedDb.close();
    });
  });

  describe('manejo de errores', () => {
    it('responde 400 (no 500) ante JSON mal formado', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .set('Content-Type', 'application/json')
        .send('{"name": "x",');
      expect(res.status).toBe(400);
    });

    it('responde 413 ante un cuerpo demasiado grande', async () => {
      const res = await request(app)
        .post(REGISTER_PATH)
        .send({ ...VALID_USER, name: 'a'.repeat(20 * 1024) });
      expect(res.status).toBe(413);
    });

    it('responde 500 con mensaje genérico si la base de datos falla', async () => {
      db.close();
      const res = await request(app).post(REGISTER_PATH).send(VALID_USER);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error interno del servidor');
      ({ app, db } = createApp({ dbPath: ':memory:' }));
    });
  });

  describe('JWT', () => {
    const payload = { sub: 1, email: 'x@example.com', role: 'admin' };

    it('rechaza un token firmado con otro algoritmo (HS512)', async () => {
      const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS512' });
      const res = await request(app).get(ME_PATH).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    it('rechaza un token sin firma (alg: none)', async () => {
      const token = jwt.sign(payload, '', { algorithm: 'none' });
      const res = await request(app).get(ME_PATH).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    it('rechaza un token expirado', async () => {
      const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: -10 });
      const res = await request(app).get(ME_PATH).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    it('rechaza un token firmado con otro secreto', async () => {
      const token = jwt.sign(payload, 'otro-secreto', { algorithm: 'HS256' });
      const res = await request(app).get(ME_PATH).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    });

    it('devuelve 404 si el usuario del token ya no existe', async () => {
      const token = jwt.sign({ ...payload, sub: 9999 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
      const res = await request(app).get(ME_PATH).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('login', () => {
    it('no revela si el correo existe (mismo mensaje y estado)', async () => {
      await request(app).post(REGISTER_PATH).send(VALID_USER);

      const wrongPassword = await request(app)
        .post(LOGIN_PATH)
        .send({ email: VALID_USER.email, password: 'incorrecta123' });
      const unknownEmail = await request(app)
        .post(LOGIN_PATH)
        .send({ email: 'nadie@example.com', password: 'incorrecta123' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });

    it('normaliza el correo (mayúsculas y espacios) al iniciar sesión', async () => {
      await request(app).post(REGISTER_PATH).send(VALID_USER);
      const res = await request(app)
        .post(LOGIN_PATH)
        .send({ email: '  LUIS@Example.COM ', password: VALID_USER.password });
      expect(res.status).toBe(200);
    });
  });

  describe('limitación de intentos', () => {
    it('responde 429 tras superar el límite de intentos de login', async () => {
      const results = [];
      for (let i = 0; i < 21; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app)
          .post(LOGIN_PATH)
          .send({ email: 'x@example.com', password: 'incorrecta123' });
        results.push(res.status);
      }
      expect(results[19]).toBe(401);
      expect(results[20]).toBe(429);
    }, 30000);
  });
});
