class UserModel {
  constructor(db) {
    this.db = db;
  }

  create({ name, email, passwordHash, role }) {
    const stmt = this.db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(name, email, passwordHash, role);
    return this.findById(info.lastInsertRowid);
  }

  findByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  list() {
    return this.db
      .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id')
      .all();
  }
}

module.exports = { UserModel };
