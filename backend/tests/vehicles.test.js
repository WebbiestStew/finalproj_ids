require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { UserModel } = require('../src/models/User');

const VEHICLES = '/api/vehicles';
const REGISTER = '/api/auth/register';
const AUTH = 'Authorization';
const PASSWORD = 'password123';

const CAR = {
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
  price: 329900,
  mileage: 42000,
  color: 'Blanco',
  transmission: 'Automática',
  fuel: 'Gasolina',
  body: 'Sedán',
  description: 'Único dueño',
};

describe('vehicles API', () => {
  let app;
  let db;

  const register = async (role, email, name = 'Cuenta Prueba') => {
    const res = await request(app).post(REGISTER).send({ name, email, password: PASSWORD, role });
    return { token: res.body.token, id: res.body.user.id };
  };
  const publish = async (token, overrides = {}) =>
    request(app).post(VEHICLES).set(AUTH, `Bearer ${token}`).send({ ...CAR, ...overrides });
  const auth = (token) => ({ [AUTH]: `Bearer ${token}` });

  beforeEach(() => {
    ({ app, db } = createApp({ dbPath: ':memory:' }));
  });

  afterEach(() => {
    db.close();
  });

  describe('publicar (POST /api/vehicles)', () => {
    it('una concesionaria publica un vehículo y queda a su nombre', async () => {
      const dealer = await register('concesionaria', 'norte@example.com', 'Autos del Norte');
      const res = await publish(dealer.token);

      expect(res.status).toBe(201);
      expect(res.body.vehicle).toMatchObject({ brand: 'Toyota', model: 'Corolla', status: 'disponible', dealer_id: dealer.id, dealer_name: 'Autos del Norte' });
    });

    it('rechaza sin sesión (401)', async () => {
      const res = await request(app).post(VEHICLES).send(CAR);
      expect(res.status).toBe(401);
    });

    it('rechaza a un comprador y a un admin (403): solo publican concesionarias', async () => {
      const buyer = await register('comprador', 'comprador@example.com');
      expect((await publish(buyer.token)).status).toBe(403);

      const admin = new UserModel(db).create({ name: 'Admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync(PASSWORD, 4), role: 'admin' });
      const login = await request(app).post('/api/auth/login').send({ email: admin.email, password: PASSWORD });
      expect((await publish(login.body.token)).status).toBe(403);
    });

    it.each([
      ['año futuro', { year: 2100 }, /año/],
      ['año antiguo', { year: 1950 }, /año/],
      ['precio cero', { price: 0 }, /precio/],
      ['precio decimal', { price: 100.5 }, /entero/],
      ['kilometraje negativo', { mileage: -1 }, /kilometraje/],
      ['color fuera del catálogo', { color: 'Fucsia' }, /color/],
      ['carrocería inválida', { body: 'Tanque' }, /carrocería/],
      ['marca vacía', { brand: '' }, /marca/],
      ['descripción con marcado', { description: '<script>alert(1)</script>' }, /descripción/],
      ['precio como texto', { price: '100' }, /número/],
    ])('valida %s', async (_label, override, message) => {
      const dealer = await register('concesionaria', 'valida@example.com');
      const res = await publish(dealer.token, override);

      expect(res.status).toBe(400);
      expect(res.body.error.join(' ')).toMatch(message);
    });

    it('guarda el texto tal cual (consultas parametrizadas) aun con comillas', async () => {
      const dealer = await register('concesionaria', 'sqli@example.com');
      const res = await publish(dealer.token, { model: "Robert'); DROP TABLE vehicles;--" });

      expect(res.status).toBe(201);
      expect((await request(app).get(VEHICLES)).body.total).toBe(1);
    });
  });

  describe('catálogo público (GET /api/vehicles)', () => {
    let dealer;

    beforeEach(async () => {
      dealer = await register('concesionaria', 'catalogo@example.com', 'Motores Monterrey');
      await publish(dealer.token);
      await publish(dealer.token, { brand: 'Nissan', model: 'Versa', year: 2018, price: 189000, mileage: 90000, color: 'Plata', transmission: 'Manual', body: 'Sedán' });
      await publish(dealer.token, { brand: 'Honda', model: 'CR-V', year: 2022, price: 489000, mileage: 15000, color: 'Negro', body: 'SUV' });
      await publish(dealer.token, { brand: 'Mazda', model: 'Mazda3', year: 2019, price: 279000, mileage: 60000, color: 'Rojo', body: 'Hatchback' });
    });

    it('es público: lista sin iniciar sesión y trae el nombre de la concesionaria', async () => {
      const res = await request(app).get(VEHICLES);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body.vehicles[0].dealer_name).toBe('Motores Monterrey');
    });

    it.each([
      ['q por marca', 'q=honda', ['CR-V']],
      ['q por marca y modelo', 'q=toyota%20corolla', ['Corolla']],
      ['marca exacta', 'brand=Nissan', ['Versa']],
      ['carrocería', 'body=SUV', ['CR-V']],
      ['transmisión', 'transmission=Manual', ['Versa']],
      ['precio máximo', 'maxPrice=200000', ['Versa']],
      ['precio mínimo', 'minPrice=400000', ['CR-V']],
      ['año mínimo', 'minYear=2021', ['CR-V', 'Corolla']],
      ['año máximo', 'maxYear=2018', ['Versa']],
      ['kilometraje máximo', 'maxMileage=20000', ['CR-V']],
    ])('filtra por %s', async (_label, query, expected) => {
      const res = await request(app).get(`${VEHICLES}?${query}&sort=precio_asc`);

      expect(res.status).toBe(200);
      expect(res.body.vehicles.map((v) => v.model).sort()).toEqual([...expected].sort());
    });

    it.each([
      ['precio_asc', ['Versa', 'Mazda3', 'Corolla', 'CR-V']],
      ['precio_desc', ['CR-V', 'Corolla', 'Mazda3', 'Versa']],
      ['anio_desc', ['CR-V', 'Corolla', 'Mazda3', 'Versa']],
      ['km_asc', ['CR-V', 'Corolla', 'Mazda3', 'Versa']],
      ['recientes', ['Mazda3', 'CR-V', 'Versa', 'Corolla']],
    ])('ordena por %s', async (sort, expected) => {
      const res = await request(app).get(`${VEHICLES}?sort=${sort}`);
      expect(res.body.vehicles.map((v) => v.model)).toEqual(expected);
    });

    it('pagina y reporta el total', async () => {
      const first = await request(app).get(`${VEHICLES}?limit=3&sort=precio_asc`);
      const second = await request(app).get(`${VEHICLES}?limit=3&offset=3&sort=precio_asc`);

      expect(first.body).toMatchObject({ total: 4, limit: 3, offset: 0 });
      expect(first.body.vehicles).toHaveLength(3);
      expect(second.body.vehicles.map((v) => v.model)).toEqual(['CR-V']);
    });

    it('trata los filtros vacíos como "sin filtro"', async () => {
      const res = await request(app).get(`${VEHICLES}?q=&brand=&minPrice=&sort=&limit=`);
      expect(res.body.total).toBe(4);
    });

    it('no interpreta % ni _ de la búsqueda como comodines', async () => {
      const res = await request(app).get(`${VEHICLES}?q=%25`);
      expect(res.body.total).toBe(0);
    });

    it('una búsqueda con inyección SQL no devuelve nada ni rompe', async () => {
      const res = await request(app).get(`${VEHICLES}?q=${encodeURIComponent("' OR 1=1 --")}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });

    it.each([
      ['orden desconocido', 'sort=precio;DROP'],
      ['precio no numérico', 'minPrice=abc'],
      ['límite excesivo', 'limit=1000'],
      ['carrocería inválida', 'body=Tanque'],
      ['offset negativo', 'offset=-1'],
    ])('responde 400 ante %s', async (_label, query) => {
      const res = await request(app).get(`${VEHICLES}?${query}`);
      expect(res.status).toBe(400);
    });

    it('lista las marcas disponibles sin repetir y en orden', async () => {
      await publish(dealer.token, { brand: 'Honda', model: 'Civic' });
      const res = await request(app).get(`${VEHICLES}/brands`);

      expect(res.body.brands).toEqual(['Honda', 'Mazda', 'Nissan', 'Toyota']);
    });
  });

  describe('estados: un auto vendido no sigue listado (riesgo R4)', () => {
    it('vendido sale del catálogo y de las marcas; apartado sigue visible', async () => {
      const dealer = await register('concesionaria', 'estados@example.com');
      const sold = (await publish(dealer.token, { brand: 'Kia', model: 'Rio' })).body.vehicle;
      const held = (await publish(dealer.token, { brand: 'Ford', model: 'Focus' })).body.vehicle;

      await request(app).patch(`${VEHICLES}/${sold.id}/status`).set(auth(dealer.token)).send({ status: 'vendido' });
      await request(app).patch(`${VEHICLES}/${held.id}/status`).set(auth(dealer.token)).send({ status: 'apartado' });

      const list = await request(app).get(VEHICLES);
      expect(list.body.vehicles.map((v) => v.model)).toEqual(['Focus']);
      expect(list.body.vehicles[0].status).toBe('apartado');
      expect((await request(app).get(`${VEHICLES}/brands`)).body.brands).toEqual(['Ford']);
    });

    it('rechaza un estado inválido', async () => {
      const dealer = await register('concesionaria', 'estado-malo@example.com');
      const car = (await publish(dealer.token)).body.vehicle;
      const res = await request(app).patch(`${VEHICLES}/${car.id}/status`).set(auth(dealer.token)).send({ status: 'regalado' });

      expect(res.status).toBe(400);
    });
  });

  describe('detalle (GET /api/vehicles/:id)', () => {
    it('devuelve el vehículo sin necesidad de sesión', async () => {
      const dealer = await register('concesionaria', 'detalle@example.com');
      const car = (await publish(dealer.token)).body.vehicle;
      const res = await request(app).get(`${VEHICLES}/${car.id}`);

      expect(res.status).toBe(200);
      expect(res.body.vehicle.model).toBe('Corolla');
    });

    it.each(['9999', 'abc'])('responde 404 para el id "%s"', async (id) => {
      expect((await request(app).get(`${VEHICLES}/${id}`)).status).toBe(404);
    });
  });

  describe('mi inventario (GET /api/vehicles/mine)', () => {
    it('cada concesionaria ve solo lo suyo, en cualquier estado', async () => {
      const a = await register('concesionaria', 'a@example.com');
      const b = await register('concesionaria', 'b@example.com');
      const mineA = (await publish(a.token, { model: 'Auto A' })).body.vehicle;
      await publish(b.token, { model: 'Auto B' });
      await request(app).patch(`${VEHICLES}/${mineA.id}/status`).set(auth(a.token)).send({ status: 'vendido' });

      const res = await request(app).get(`${VEHICLES}/mine`).set(auth(a.token));
      expect(res.body.vehicles.map((v) => v.model)).toEqual(['Auto A']);
    });

    it('solo para concesionarias', async () => {
      const buyer = await register('comprador', 'mine-comprador@example.com');
      expect((await request(app).get(`${VEHICLES}/mine`).set(auth(buyer.token))).status).toBe(403);
      expect((await request(app).get(`${VEHICLES}/mine`)).status).toBe(401);
    });
  });

  describe('editar y eliminar', () => {
    let owner;
    let other;
    let car;

    beforeEach(async () => {
      owner = await register('concesionaria', 'duena@example.com');
      other = await register('concesionaria', 'otra@example.com');
      car = (await publish(owner.token)).body.vehicle;
    });

    it('la dueña actualiza su vehículo', async () => {
      const res = await request(app).put(`${VEHICLES}/${car.id}`).set(auth(owner.token)).send({ ...CAR, price: 300000 });

      expect(res.status).toBe(200);
      expect(res.body.vehicle.price).toBe(300000);
    });

    it('otra concesionaria no puede editar, cambiar el estado ni eliminar (403)', async () => {
      expect((await request(app).put(`${VEHICLES}/${car.id}`).set(auth(other.token)).send(CAR)).status).toBe(403);
      expect((await request(app).patch(`${VEHICLES}/${car.id}/status`).set(auth(other.token)).send({ status: 'vendido' })).status).toBe(403);
      expect((await request(app).delete(`${VEHICLES}/${car.id}`).set(auth(other.token))).status).toBe(403);
      expect((await request(app).get(`${VEHICLES}/${car.id}`)).body.vehicle.status).toBe('disponible');
    });

    it('un admin puede moderar (eliminar) cualquier vehículo', async () => {
      new UserModel(db).create({ name: 'Admin', email: 'mod@example.com', passwordHash: bcrypt.hashSync(PASSWORD, 4), role: 'admin' });
      const login = await request(app).post('/api/auth/login').send({ email: 'mod@example.com', password: PASSWORD });

      expect((await request(app).delete(`${VEHICLES}/${car.id}`).set(auth(login.body.token))).status).toBe(204);
    });

    it('la dueña elimina su vehículo y desaparece del catálogo', async () => {
      expect((await request(app).delete(`${VEHICLES}/${car.id}`).set(auth(owner.token))).status).toBe(204);
      expect((await request(app).get(`${VEHICLES}/${car.id}`)).status).toBe(404);
    });

    it('editar valida igual que publicar', async () => {
      const res = await request(app).put(`${VEHICLES}/${car.id}`).set(auth(owner.token)).send({ ...CAR, year: 1900 });
      expect(res.status).toBe(400);
    });

    it('responde 404 al modificar un vehículo inexistente', async () => {
      expect((await request(app).put(`${VEHICLES}/9999`).set(auth(owner.token)).send(CAR)).status).toBe(404);
      expect((await request(app).delete(`${VEHICLES}/9999`).set(auth(owner.token))).status).toBe(404);
    });

    it('exige sesión para modificar', async () => {
      expect((await request(app).delete(`${VEHICLES}/${car.id}`)).status).toBe(401);
    });
  });

  it('al borrar una cuenta de concesionaria se borran sus vehículos (integridad referencial)', async () => {
    const dealer = await register('concesionaria', 'cascada@example.com');
    await publish(dealer.token);
    db.prepare('DELETE FROM users WHERE id = ?').run(dealer.id);

    expect((await request(app).get(VEHICLES)).body.total).toBe(0);
  });
});
