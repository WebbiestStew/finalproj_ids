#!/usr/bin/env node
// One-time setup: installs both projects, writes the .env files (with a freshly
// generated JWT secret and admin password) and tells you how to start.
// Safe to re-run: it never overwrites an .env that already exists.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skipInstall = process.argv.includes('--skip-install');
const isWindows = process.platform === 'win32';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 19)) {
  console.error(`DAuto necesita Node 20.19 o más nuevo (tienes ${process.versions.node}). Instala Node 22 desde https://nodejs.org`);
  process.exit(1);
}

const secret = () => randomBytes(32).toString('hex');
const password = () => randomBytes(9).toString('base64url'); // 12 URL-safe characters
const say = (message) => console.log(message);

function install(folder) {
  say(`\n▸ Instalando dependencias de ${folder}/ ...`);
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: join(root, folder), stdio: 'inherit', shell: isWindows });
  if (result.status !== 0) {
    console.error(`\nFalló npm install en ${folder}/. Revisa el error de arriba y vuelve a ejecutar: npm run setup`);
    process.exit(result.status || 1);
  }
}

// Returns the value of KEY in an .env file, or undefined.
function readValue(file, key) {
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : undefined;
}

if (!skipInstall) {
  install('backend');
  install('frontend');
}

const adminPassword = password();
const created = [];

const backendEnv = join(root, 'backend', '.env');
if (!existsSync(backendEnv)) {
  writeFileSync(
    backendEnv,
    [
      'PORT=3000',
      `JWT_SECRET=${secret()}`,
      'DB_PATH=./data/dauto.db',
      '',
      '# Se crean al iniciar el servidor si no existen (ver backend/README.md)',
      'ADMIN_EMAIL=admin@dauto.com',
      `ADMIN_PASSWORD=${adminPassword}`,
      'SEED_DEMO=true',
      'DEMO_PASSWORD=demo-password-123',
      '',
    ].join('\n')
  );
  created.push('backend/.env');
}

const rootEnv = join(root, '.env');
if (!existsSync(rootEnv)) {
  writeFileSync(
    rootEnv,
    [
      '# Variables para `docker compose up` (ver docs/despliegue.md)',
      `JWT_SECRET=${secret()}`,
      'ADMIN_EMAIL=admin@dauto.com',
      `ADMIN_PASSWORD=${adminPassword}`,
      'SEED_DEMO=true',
      '',
    ].join('\n')
  );
  created.push('.env');
}

say('\n✔ Listo.\n');
say(created.length ? `Archivos creados: ${created.join(', ')}` : 'Los archivos .env ya existían; no se tocó nada.');
say('\nPara iniciar (backend + frontend juntos):\n\n    npm run dev\n\nLuego abre  http://localhost:5173\n');

const shownPassword = readValue(backendEnv, 'ADMIN_PASSWORD');
say('Cuentas para probar (se crean solas la primera vez que arranca el servidor):');
say(`  Administrador   ${readValue(backendEnv, 'ADMIN_EMAIL') || 'admin@dauto.com'}   contraseña: ${shownPassword || '(la de tu .env)'}`);
say('  Concesionaria   contacto@autosnorte.com   contraseña: demo-password-123');
say('  Comprador       créalo tú en /registro\n');
