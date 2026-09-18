const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function createDatabase(dbPath) {
  const target = dbPath || process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'dauto.db');

  if (target !== ':memory:') {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(target);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'concesionaria', 'comprador')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0),
      mileage INTEGER NOT NULL CHECK (mileage >= 0),
      color TEXT NOT NULL,
      transmission TEXT NOT NULL,
      fuel TEXT NOT NULL,
      body TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'apartado', 'vendido')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_status_price ON vehicles (status, price);
    CREATE INDEX IF NOT EXISTS idx_vehicles_dealer ON vehicles (dealer_id);
  `);

  return db;
}

module.exports = { createDatabase };
