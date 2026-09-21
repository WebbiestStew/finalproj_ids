# Correr y desplegar DAuto

DAuto es **una sola aplicación**: el backend sirve la API y también el frontend ya compilado, en
el mismo puerto. Por eso desplegarlo es desplegar un solo servicio (una imagen de Docker) y no
hay CORS que configurar.

## 1. En tu computadora

Necesitas **Node 22** (mínimo 20.19). Desde la raíz del repositorio:

```bash
npm run setup     # instala todo, crea los .env con un secreto generado y una contraseña de admin
npm run dev       # backend (:3000) y frontend (:5173) juntos → abre http://localhost:5173
```

`setup` imprime las cuentas de prueba. Es seguro repetirlo: nunca sobrescribe un `.env` existente.

| Quiero…                                   | Comando                       |
|-------------------------------------------|-------------------------------|
| Desarrollar (recarga en vivo)             | `npm run dev`                 |
| Ver la versión de producción en local     | `npm start` → http://localhost:3000 |
| Correr todas las pruebas                  | `npm test`                    |
| Revisar el código (lint)                  | `npm run lint`                |

## 2. Con Docker

```bash
npm run setup            # (una vez) genera el .env de la raíz
docker compose up --build
```

Abre http://localhost:3000. La base de datos vive en un volumen (`dauto-data`), así que sobrevive a
`docker compose down` y a reconstruir la imagen. Para borrarla: `docker compose down -v`.

Sin `npm run setup`: copia `.env.example` a `.env` y llena `JWT_SECRET` (`openssl rand -hex 32`)
y `ADMIN_PASSWORD`.

## 3. Variables de entorno

| Variable | ¿Obligatoria? | Qué hace |
|---|---|---|
| `JWT_SECRET` | **Sí** | Firma las sesiones. Larga y secreta: `openssl rand -hex 32`. Si la cambias, todos tienen que volver a iniciar sesión. |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | Recomendadas | Crean el administrador la primera vez que arranca (mín. 10 caracteres). Si ya existe, no se toca. Es la forma de tener admin en un hosting sin terminal. |
| `SEED_DEMO` | No | `true` agrega 2 concesionarias y 12 autos de ejemplo si faltan. |
| `DEMO_PASSWORD` | No | Contraseña para entrar como las concesionarias demo. **Déjala sin definir en un sitio público**: así esas cuentas existen pero nadie puede entrar con ellas. |
| `TRUST_PROXY` | En hosting | `1` cuando hay un proxy delante (Render, Fly, nginx). Sin esto el límite de intentos ve a todos como la misma IP. |
| `DB_PATH` | No | Dónde vive la base SQLite (en Docker: `/app/data/dauto.db`). |
| `BCRYPT_ROUNDS` | No | Costo del hash (12 por defecto; mínimo 10 en producción). Más alto = más seguro y más lento. |
| `AUTH_RATE_LIMIT`, `WRITE_RATE_LIMIT` | No | Intentos de login/registro (20) y operaciones de escritura (200) por IP cada 15 min. |
| `CORS_ORIGINS` | Solo si separas el frontend | Lista de orígenes permitidos. No hace falta si sirves todo desde el mismo dominio (lo normal). |

## 4. Desplegar en un hosting

### Opción A — Render (la más fácil; gratis, pero los datos son efímeros)

1. Sube el repositorio a GitHub.
2. En [render.com](https://render.com): **New → Blueprint** → elige el repositorio. Render lee `render.yaml`.
3. Cuando pregunte, define `ADMIN_EMAIL` y `ADMIN_PASSWORD`. `JWT_SECRET` se genera solo.
4. Espera el primer despliegue (unos minutos, construye la imagen) y abre la URL `*.onrender.com`.

Con la configuración incluida, **cada push a la rama principal vuelve a desplegar solo** (`autoDeploy: true`).

**Alternativa más estricta (opcional): desplegar solo si el pipeline pasa.** Pon `autoDeploy: false` en `render.yaml` y usa el Deploy Hook: en el servicio de Render, *Settings → Deploy
Hook* → copia la URL → en GitHub, *Settings → Secrets and variables → Actions* → crea el secreto
`RENDER_DEPLOY_HOOK`. Desde entonces, cada push a `main` que pase pruebas, build y prueba de humo
dispara el despliegue. Sin el secreto ese paso simplemente se omite.

**Limitaciones del plan gratuito:** el servicio se duerme tras un rato sin visitas (la primera petición
tarda ~30 s) y **no conserva archivos**: la base se reinicia en cada despliegue. Como el admin y los
datos demo se recrean al arrancar (`ADMIN_*` y `SEED_DEMO`), sirve bien para una demostración, pero las
cuentas y autos que la gente cree se pierden. Para conservarlos: plan de pago + el bloque `disk` que
está comentado en `render.yaml`.

### Opción B — Fly.io (datos persistentes)

```bash
brew install flyctl && fly auth login
# 1) cambia el nombre en fly.toml (debe ser único), luego:
fly launch --no-deploy --copy-config
fly volumes create dauto_data --size 1 --region qro
fly secrets set JWT_SECRET=$(openssl rand -hex 32) ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD='una-contraseña-larga'
fly deploy
```

Es SQLite: mantén **una sola máquina** (`fly scale count 1`). Revisa los precios vigentes de Fly antes de
depender de ellos; la capa gratuita ha cambiado varias veces.

### Opción C — Tu propio servidor (VPS) con HTTPS

En un servidor con Docker: clona el repositorio, crea el `.env` (mira la sección 2) y
`docker compose up -d --build`. Para HTTPS pon un proxy delante; con [Caddy](https://caddyserver.com) es
un archivo de dos líneas (`Caddyfile`):

```
tu-dominio.com {
  reverse_proxy localhost:3000
}
```

y `TRUST_PROXY=1` en el `.env`. Caddy consigue y renueva el certificado solo.

## 5. Antes de compartir la URL

- [ ] `ADMIN_PASSWORD` largo y único (no el de tus otras cuentas).
- [ ] `JWT_SECRET` generado, no escrito a mano.
- [ ] `DEMO_PASSWORD` **sin definir** si el sitio es público.
- [ ] La URL es `https://…` (Render y Fly ya lo hacen; en un VPS, con Caddy).
- [ ] `TRUST_PROXY=1` si hay proxy delante.
- [ ] Respaldo de la base: es un solo archivo. Con Docker:
      `docker compose exec dauto node -e "require('better-sqlite3')('/app/data/dauto.db').backup('/app/data/respaldo.db').then(()=>console.log('ok'))"`
      y luego copia `respaldo.db` fuera del contenedor (`docker compose cp dauto:/app/data/respaldo.db .`).

## 6. Lo que este despliegue todavía no resuelve

- **Una sola instancia:** SQLite no se comparte entre servidores. Para escalar horizontalmente hay que
  migrar a PostgreSQL (el catálogo ya está pensado con PostGIS para el mapa, ver `adv_pr.pdf`).
- **Sin fotos ni correo:** las fotos de los autos y las notificaciones por correo/SMS siguen pendientes.
- **La sesión vive en `localStorage`** (riesgo documentado en el informe de cierre, sección 5.1).

## 7. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `JWT_SECRET no está configurado` | Ejecuta `npm run setup`, o define la variable en tu hosting. |
| Docker: `Falta JWT_SECRET` | Falta el `.env` en la raíz (`npm run setup` o cópialo de `.env.example`). |
| "No se pudo conectar con el servidor" en desarrollo | El backend no está corriendo: usa `npm run dev` (levanta los dos). |
| Login/registro bloqueado con "Demasiados intentos" | Límite por IP; espera 15 min o reinicia el servidor en local. Tras un proxy, define `TRUST_PROXY=1`. |
| En Render tarda mucho la primera visita | El plan gratuito se duerme; la primera petición lo despierta. |
| Los datos desaparecen en cada despliegue | Render gratuito no tiene disco; ver Opción A o usa Fly.io. |
| `npm install` falla con `ERESOLVE`/`edgesOut` | Usa `npm run setup` (el frontend fija `legacy-peer-deps` en su `.npmrc`). |

## Estado de verificación

Verificado en local: `npm run setup` desde cero (y repetido), `npm run dev` (dos procesos y el proxy), el
servidor en modo producción sirviendo el frontend (rutas del cliente al refrescar, caché de `assets/`,
sin errores de CSP en el navegador, administrador y datos demo creados desde variables, cuentas demo
inaccesibles sin `DEMO_PASSWORD`) y una simulación capa por capa del `Dockerfile` con instalaciones
limpias.

**No verificado en esta máquina:** `docker build` / `docker compose` reales (no hay Docker instalado) ni un
despliegue real en Render o Fly (requieren tu cuenta). El pipeline de GitHub construye la imagen y hace la
prueba de humo completa en cada push a `main`; ahí se confirma el build real.
