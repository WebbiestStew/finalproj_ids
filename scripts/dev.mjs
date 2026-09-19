#!/usr/bin/env node
// Runs the API (:3000) and the frontend (:5173) together, with prefixed output,
// and stops both when either one exits or you press Ctrl+C.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(root, 'backend', '.env')) || !existsSync(join(root, 'backend', 'node_modules')) || !existsSync(join(root, 'frontend', 'node_modules'))) {
  console.error('Falta preparar el proyecto. Ejecuta primero:\n\n    npm run setup\n');
  process.exit(1);
}

const COLORS = { api: '\x1b[36m', web: '\x1b[35m' };
const RESET = '\x1b[0m';
const children = [];
let stopping = false;

function run(label, folder) {
  const child = spawn('npm', ['run', 'dev'], { cwd: join(root, folder), shell: process.platform === 'win32', env: { ...process.env, FORCE_COLOR: '1' } });
  const prefix = `${COLORS[label]}[${label}]${RESET} `;
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => {
      chunk
        .toString()
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => out.write(`${prefix}${line}\n`));
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${prefix}terminó (código ${code}); deteniendo el resto.`);
      stop(code || 1);
    }
  });
  children.push(child);
}

function stop(code = 0) {
  stopping = true;
  children.forEach((child) => child.kill('SIGTERM'));
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

console.log('DAuto en desarrollo →  http://localhost:5173   (API en http://localhost:3000)\n');
run('api', 'backend');
run('web', 'frontend');
