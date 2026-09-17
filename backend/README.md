# DAuto — Modulo de Autenticacion (Concesionarias / Compradores)

Modulo basico implementado para el avance de proyecto: registro y login con JWT,
roles (`admin`, `concesionaria`, `comprador`), y control de acceso por rol.

## Ejecutar en local

```bash
cp .env.example .env   # ajusta JWT_SECRET
npm install
npm run dev
```

## Pruebas

```bash
npm test              # unit tests
npm run test:coverage # unit tests + reporte de cobertura (umbral 80%)
npm run lint           # ESLint + eslint-plugin-sonarjs (code smells)
```

## Crear un usuario administrador

El endpoint publico de registro solo permite los roles `concesionaria` y
`comprador` (evita escalamiento de privilegios). Para crear un admin:

```bash
node scripts/seedAdmin.js "Admin DAuto" admin@dauto.com "una-password-segura"
```

## Endpoints

| Metodo | Ruta               | Auth           | Descripcion                          |
|--------|--------------------|----------------|---------------------------------------|
| POST   | /api/auth/register | -              | Registra comprador o concesionaria    |
| POST   | /api/auth/login    | -              | Devuelve JWT                          |
| GET    | /api/auth/me        | Bearer token   | Perfil del usuario autenticado        |
| GET    | /api/auth/users     | Bearer + admin | Lista de usuarios (solo administrador)|
| GET    | /health             | -              | Health check                          |

## Docker

```bash
docker build -t dauto-backend .
docker run -p 3000:3000 -e JWT_SECRET=dev-secret dauto-backend
```

## CI/CD

Ver `.github/workflows/ci-cd.yml` (lint + tests + cobertura -> build de imagen
-> push a GHCR -> smoke test en un entorno de prueba efimero) y
`.github/workflows/security-scan.yml` (OWASP ZAP baseline + SonarCloud,
opcional este ultimo si se configura `SONAR_TOKEN` y la variable de repo
`SONAR_ORGANIZATION`).
