require('./setup');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { bootstrap } = require('../src/bootstrap');
const { seedDemo, CARS, DEALERS } = require('../src/seed/demo');
const { createDatabase } = require('../src/config/db');
const { UserModel } = require('../src/models/User');
const { VehicleModel } = require('../src/models/Vehicle');
const { MAX_VEHICLES_PER_DEALER } = require('../src/utils/vehicleOptions');

const CACHE = 'cache-control';
const csp = (res) => res.headers['content-security-policy'];
const userCount = (database) => database.prepare('SELECT COUNT(*) AS n FROM users').get().n;
const CATALOG = '/api/vehicles';
const ACCEPT = 'Accept';
const HTML = 'text/html';
const ADMIN = 'admin@example.com';
const LONG_PASSWORD = 'una-contraseña-larga';
const DEMO_PASS = 'demo-pass-123';
const AUTHORIZATION = 'Authorization';
const silentLog = { log: () => {}, warn: () => {} };

describe('serving the built frontend', () => {
  let dir;
  let app;
  let db;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dauto-static-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>DAuto</title><div id="root"></div>');
    fs.writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), 'console.log("app")');
    fs.writeFileSync(path.join(dir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  });

  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  beforeEach(() => {
    ({ app, db } = createApp({ dbPath: ':memory:', staticDir: dir }));
  });

  afterEach(() => db.close());

  it('sirve index.html en la raíz, sin caché', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root">');
    expect(res.headers[CACHE]).toBe('no-cache');
  });

  it('las rutas del frontend (/catalogo, /panel, /catalogo/7) devuelven index.html para que el refresco funcione', async () => {
    for (const route of ['/catalogo', '/panel', '/catalogo/7', '/inventario/3/editar']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get(route).set(ACCEPT, HTML);
      expect(res.status).toBe(200);
      expect(res.text).toContain('<div id="root">');
    }
  });

  it('los archivos con hash en assets/ se cachean un año (immutable)', async () => {
    const res = await request(app).get('/assets/index-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers[CACHE]).toBe('public, max-age=31536000, immutable');
  });

  it('otros archivos estáticos se revalidan siempre', async () => {
    const res = await request(app).get('/favicon.svg');
    expect(res.status).toBe(200);
    expect(res.headers[CACHE]).toBe('no-cache');
  });

  it('un archivo inexistente es un 404 real, no index.html', async () => {
    const res = await request(app).get('/assets/no-existe.js').set(ACCEPT, '*/*');
    expect(res.status).toBe(404);
  });

  it('una ruta de la API inexistente sigue siendo 404 JSON, aunque el cliente acepte HTML', async () => {
    const res = await request(app).get('/api/no-existe').set(ACCEPT, HTML);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ruta no encontrada');
  });

  it('la API y /health siguen funcionando y sin caché', async () => {
    const health = await request(app).get('/health');
    const catalog = await request(app).get(CATALOG);

    expect(health.body).toEqual({ status: 'ok' });
    expect(catalog.status).toBe(200);
    expect(catalog.headers[CACHE]).toBe('no-store');
  });

  it('un cliente que no acepta HTML (curl, JSON) no recibe index.html en rutas desconocidas', async () => {
    const res = await request(app).get('/ruta-desconocida').set(ACCEPT, 'application/json');
    expect(res.status).toBe(404);
  });

  it('sin staticDir la raíz responde con la información del servicio (modo solo API)', async () => {
    const { app: apiOnly, db: apiDb } = createApp({ dbPath: ':memory:' });
    const res = await request(apiOnly).get('/');

    expect(res.body).toMatchObject({ service: 'dauto-backend', status: 'ok' });
    apiDb.close();
  });
});

describe('cabeceras de seguridad al servir por http', () => {
  it('no incluye upgrade-insecure-requests (rompería el acceso por http://localhost)', async () => {
    const { app, db } = createApp({ dbPath: ':memory:' });
    const res = await request(app).get('/health');

    expect(csp(res)).toBeDefined();
    expect(csp(res)).not.toContain('upgrade-insecure-requests');
    expect(csp(res)).toContain("default-src 'self'");
    expect(res.headers['strict-transport-security']).toBeDefined();
    db.close();
  });
});

describe('bootstrap (administrador y datos demo desde variables de entorno)', () => {
  let db;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  afterEach(() => db.close());

  it('no hace nada sin variables', () => {
    expect(bootstrap(db, {}, silentLog)).toEqual({ admin: 'skipped', demo: 'skipped' });
    expect(userCount(db)).toBe(0);
  });

  it('crea el administrador con contraseña que sí funciona', () => {
    const env = { ADMIN_EMAIL: `  ${ADMIN.toUpperCase()} `, ADMIN_PASSWORD: LONG_PASSWORD };

    expect(bootstrap(db, env, silentLog).admin).toBe('created');
    const admin = new UserModel(db).findByEmail(ADMIN);
    expect(admin.role).toBe('admin');
    expect(bcrypt.compareSync(LONG_PASSWORD, admin.password_hash)).toBe(true);
  });

  it('es idempotente: reiniciar no duplica ni cambia la contraseña del admin', () => {
    const env = { ADMIN_EMAIL: ADMIN, ADMIN_PASSWORD: LONG_PASSWORD };
    bootstrap(db, env, silentLog);
    const before = new UserModel(db).findByEmail(ADMIN).password_hash;

    expect(bootstrap(db, { ...env, ADMIN_PASSWORD: 'otra-contraseña-larga' }, silentLog).admin).toBe('exists');
    expect(userCount(db)).toBe(1);
    expect(new UserModel(db).findByEmail(ADMIN).password_hash).toBe(before);
  });

  it('rechaza una contraseña de administrador débil y avisa', () => {
    const warn = jest.fn();
    const result = bootstrap(db, { ADMIN_EMAIL: ADMIN, ADMIN_PASSWORD: 'corta' }, { log: () => {}, warn });

    expect(result.admin).toBe('weak-password');
    expect(warn).toHaveBeenCalled();
    expect(userCount(db)).toBe(0);
  });

  it.each([
    [{ ADMIN_EMAIL: ADMIN }],
    [{ ADMIN_PASSWORD: LONG_PASSWORD }],
  ])('exige correo y contraseña juntos (%j)', (env) => {
    expect(bootstrap(db, env, silentLog).admin).toBe('incomplete');
    expect(userCount(db)).toBe(0);
  });

  it('SEED_DEMO=true agrega los autos demo una sola vez', () => {
    expect(bootstrap(db, { SEED_DEMO: 'true' }, silentLog).demo).toBe('added');
    expect(bootstrap(db, { SEED_DEMO: 'true' }, silentLog).demo).toBe('present');
    expect(db.prepare('SELECT COUNT(*) AS n FROM vehicles').get().n).toBe(CARS.length);
  });

  it('SEED_DEMO distinto de "true" no siembra nada', () => {
    expect(bootstrap(db, { SEED_DEMO: 'yes' }, silentLog).demo).toBe('skipped');
  });
});

describe('seedDemo', () => {
  let db;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  afterEach(() => db.close());

  it('crea las concesionarias y todos los vehículos', () => {
    const result = seedDemo(db, { password: DEMO_PASS });

    expect(result).toMatchObject({ added: CARS.length, loginEnabled: true, dealers: DEALERS.map((d) => d.email) });
    expect(new UserModel(db).findByEmail(DEALERS[0].email).role).toBe('concesionaria');
  });

  it('con contraseña, se puede iniciar sesión como la concesionaria demo', () => {
    seedDemo(db, { password: DEMO_PASS });
    const dealer = new UserModel(db).findByEmail(DEALERS[0].email);

    expect(bcrypt.compareSync(DEMO_PASS, dealer.password_hash)).toBe(true);
  });

  it('SIN contraseña las cuentas demo no son accesibles (seguro por defecto en despliegues públicos)', () => {
    const result = seedDemo(db);
    const dealer = new UserModel(db).findByEmail(DEALERS[0].email);

    expect(result.loginEnabled).toBe(false);
    for (const guess of ['demo-password-123', 'password', 'admin', '']) {
      expect(bcrypt.compareSync(guess, dealer.password_hash)).toBe(false);
    }
  });

  it('es idempotente', () => {
    seedDemo(db);
    const again = seedDemo(db);

    expect(again.added).toBe(0);
    expect(again.existing).toBe(CARS.length);
    expect(db.prepare('SELECT COUNT(*) AS n FROM vehicles').get().n).toBe(CARS.length);
  });

  it('los datos demo cumplen las reglas del catálogo (marcas visibles y filtrables)', () => {
    seedDemo(db);
    const { total } = new VehicleModel(db).search({ statuses: ['disponible'], sort: 'recientes', limit: 48, offset: 0 });

    expect(total).toBe(CARS.length);
  });
});

describe('límites de escritura', () => {
  it('una concesionaria no puede pasar del máximo de vehículos publicados (409)', async () => {
    const { app, db } = createApp({ dbPath: ':memory:' });
    const dealer = await request(app).post('/api/auth/register').send({ name: 'Autos Grandes', email: 'grandes@example.com', password: 'password123', role: 'concesionaria' });
    const model = new VehicleModel(db);
    const car = { brand: 'Kia', model: 'Rio', year: 2020, price: 100000, mileage: 1000, color: 'Rojo', transmission: 'Manual', fuel: 'Gasolina', body: 'Sedán', description: '' };
    for (let i = 0; i < MAX_VEHICLES_PER_DEALER; i += 1) model.create(dealer.body.user.id, car);

    const res = await request(app).post(CATALOG).set(AUTHORIZATION, `Bearer ${dealer.body.token}`).send(car);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/límite/);
    db.close();
  });

  it('las operaciones de escritura sobre el catálogo tienen límite de frecuencia (429)', async () => {
    process.env.WRITE_RATE_LIMIT = '3';
    const { app, db } = createApp({ dbPath: ':memory:' });
    delete process.env.WRITE_RATE_LIMIT;

    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      statuses.push((await request(app).post(CATALOG).send({})).status);
    }

    expect(statuses).toEqual([401, 401, 401, 429, 429]);
    db.close();
  });

  it('las lecturas del catálogo NO cuentan para ese límite', async () => {
    process.env.WRITE_RATE_LIMIT = '2';
    const { app, db } = createApp({ dbPath: ':memory:' });
    delete process.env.WRITE_RATE_LIMIT;

    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect((await request(app).get(CATALOG)).status).toBe(200);
    }
    db.close();
  });
});
