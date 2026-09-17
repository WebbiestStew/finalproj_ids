require('./setup');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createDatabase } = require('../src/config/db');

describe('config/db', () => {
  it('crea el directorio y el archivo de base de datos cuando no existen', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dauto-db-'));
    const dbPath = path.join(tmpDir, 'nested', 'dauto.db');

    const db = createDatabase(dbPath);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .all();

    expect(tables.length).toBe(1);
    expect(fs.existsSync(dbPath)).toBe(true);

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('acepta :memory: sin crear archivos en disco', () => {
    const db = createDatabase(':memory:');
    expect(db.name).toBe(':memory:');
    db.close();
  });
});
