# DAuto — backend

API REST de DAuto: autenticación con JWT (tres roles: `admin`, `concesionaria`, `comprador`)
y el catálogo de vehículos, que publican y administran las concesionarias. Express + SQLite.

## Ejecutar en local

Lo más simple es desde la raíz del repositorio: `npm run setup` y `npm run dev` (levanta también el
frontend). Solo el backend:

```bash
cp .env.example .env   # y define JWT_SECRET (o corre `npm run setup` en la raíz, que lo genera)
npm install
npm run dev            # http://localhost:3000
```

Si existe `frontend/dist` (tras `npm run build` en la raíz), el servidor también sirve la app
compilada en `/`, con las rutas del cliente funcionando al refrescar. En desarrollo el CORS solo acepta
`http://localhost:5173`; las variables opcionales están comentadas en `.env.example`. Al arrancar, si
defines `ADMIN_EMAIL`/`ADMIN_PASSWORD` y `SEED_DEMO=true`, crea el administrador y los datos demo
(idempotente); ver `docs/despliegue.md`.

## Endpoints

| Método | Ruta                 | Auth            | Descripción                              |
|--------|----------------------|-----------------|------------------------------------------|
| POST   | `/api/auth/register` | —               | Registra comprador o concesionaria       |
| POST   | `/api/auth/login`    | —               | Devuelve un JWT (2 h de vigencia)        |
| GET    | `/api/auth/me`       | Bearer          | Perfil del usuario autenticado           |
| GET    | `/api/auth/users`    | Bearer + admin  | Lista de usuarios                        |
| GET    | `/health`            | —               | Health check                             |
| GET    | `/api/vehicles`      | —               | Catálogo público con filtros y paginación |
| GET    | `/api/vehicles/brands` | —             | Marcas con autos disponibles             |
| GET    | `/api/vehicles/:id`  | —               | Detalle de un vehículo                   |
| GET    | `/api/vehicles/mine` | Bearer + concesionaria | Todo mi inventario, en cualquier estado |
| POST   | `/api/vehicles`      | Bearer + concesionaria | Publica un vehículo               |
| PUT    | `/api/vehicles/:id`  | Bearer + dueña o admin | Edita un vehículo                 |
| PATCH  | `/api/vehicles/:id/status` | Bearer + dueña o admin | `disponible` / `apartado` / `vendido` |
| DELETE | `/api/vehicles/:id`  | Bearer + dueña o admin | Elimina un vehículo               |

Filtros del catálogo (`GET /api/vehicles`): `q` (marca o modelo), `brand`, `body`,
`transmission`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `maxMileage`, `sort`
(`recientes`, `precio_asc`, `precio_desc`, `anio_desc`, `km_asc`), `limit` (máx. 48) y `offset`.
Un auto `vendido` nunca aparece en el catálogo público. Cada concesionaria solo puede
modificar sus propios autos; el admin puede moderar cualquiera.

El registro público solo permite `comprador` y `concesionaria`, para que nadie pueda
auto-asignarse `admin`. Para crear un administrador:

```bash
node scripts/seedAdmin.js "Admin DAuto" admin@dauto.com "una-contraseña-segura"
```

Para tener autos en el catálogo desde el primer momento (2 concesionarias demo y 12 vehículos;
se puede repetir sin duplicar nada):

```bash
node scripts/seedDemo.js
```

## Seguridad (lo que hay y por qué)

- **JWT HS256 con el algoritmo fijado** al verificar: un token con otro algoritmo (o
  `alg: none`) se rechaza. Cubierto por pruebas.
- **bcrypt asíncrono**, factor 12 por defecto (`BCRYPT_ROUNDS`; mínimo 10 en producción).
  El correo inexistente también consume un hash, para no revelar por tiempo qué cuentas existen.
- **Validación con zod** y consultas parametrizadas; el nombre rechaza `<` y `>`.
- **CORS con lista blanca** (nunca `*`) y `Cache-Control: no-store` en todas las respuestas
  — ambos salieron de advertencias reales del escaneo OWASP ZAP.
- `helmet`, límite de intentos en login/registro, cuerpo máximo de 10 kB, JSON mal formado
  responde 400 y los errores internos nunca filtran detalles.

## Pruebas y calidad

```bash
npm test               # pruebas
npm run test:coverage  # con cobertura (umbral 80 %, hoy 100 % de líneas)
npm run lint           # ESLint + eslint-plugin-sonarjs
npm run duplication    # jscpd, falla si supera 3 %
```

## Rendimiento (medido, no supuesto)

Una sola instancia en una laptop de 8 núcleos, con `autocannon`:

| Prueba                         | Resultado                                              |
|--------------------------------|--------------------------------------------------------|
| `GET /api/auth/me`, 100 conex. | ~11 000 req/s, p99 = 11 ms, 0 errores                   |
| `POST /api/auth/login`, cost 12 | **3.75 logins/s** (10 concurrentes → ~2.4 s cada uno)  |
| `POST /api/auth/login`, cost 10 | 16.75 logins/s (~4.5×)                                 |

El cuello de botella es el hash de contraseñas, no la API. Ver el informe de cierre
para las conclusiones y el plan.

## Docker

El `Dockerfile` está en la raíz del repositorio y construye una sola imagen con la API y el
frontend:

```bash
docker build -t dauto ..
docker run -p 3000:3000 -e JWT_SECRET=$(openssl rand -hex 32) -v dauto-data:/app/data dauto
```

## CI/CD

`.github/workflows/ci-cd.yml`: auditoría de dependencias → lint → duplicación → pruebas con
cobertura → job del frontend → build de Docker → push a GHCR → prueba de humo de la app completa
→ (opcional) despliegue al hosting.
`.github/workflows/security-scan.yml`: OWASP ZAP baseline (y SonarCloud si se configuran
`SONAR_TOKEN` y la variable `SONAR_ORGANIZATION`).
