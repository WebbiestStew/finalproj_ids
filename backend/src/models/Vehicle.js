// ORDER BY can't be parameterized, so user input only ever *selects* one of these
// fixed fragments — it is never concatenated into the query.
const SORTS = {
  recientes: 'v.created_at DESC, v.id DESC',
  precio_asc: 'v.price ASC, v.id ASC',
  precio_desc: 'v.price DESC, v.id DESC',
  anio_desc: 'v.year DESC, v.id DESC',
  km_asc: 'v.mileage ASC, v.id ASC',
};

const BASE_SELECT = 'SELECT v.*, u.name AS dealer_name FROM vehicles v JOIN users u ON u.id = v.dealer_id';
const COLUMNS = ['brand', 'model', 'year', 'price', 'mileage', 'color', 'transmission', 'fuel', 'body', 'description'];

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

class VehicleModel {
  constructor(db) {
    this.db = db;
  }

  create(dealerId, data) {
    const info = this.db
      .prepare(`INSERT INTO vehicles (dealer_id, ${COLUMNS.join(', ')}) VALUES (?, ${COLUMNS.map(() => '?').join(', ')})`)
      .run(dealerId, ...COLUMNS.map((c) => data[c]));
    return this.findById(info.lastInsertRowid);
  }

  findById(id) {
    return this.db.prepare(`${BASE_SELECT} WHERE v.id = ?`).get(id);
  }

  update(id, data) {
    const assignments = COLUMNS.map((column) => `${column} = ?`).join(', ');
    this.db
      .prepare(`UPDATE vehicles SET ${assignments}, updated_at = datetime('now') WHERE id = ?`)
      .run(...COLUMNS.map((column) => data[column]), id);
    return this.findById(id);
  }

  setStatus(id, status) {
    this.db.prepare("UPDATE vehicles SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return this.findById(id);
  }

  remove(id) {
    this.db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  }

  countByDealer(dealerId) {
    return this.db.prepare('SELECT COUNT(*) AS n FROM vehicles WHERE dealer_id = ?').get(dealerId).n;
  }

  listByDealer(dealerId) {
    return this.db.prepare(`${BASE_SELECT} WHERE v.dealer_id = ? ORDER BY v.created_at DESC, v.id DESC`).all(dealerId);
  }

  brands(statuses) {
    const marks = statuses.map(() => '?').join(', ');
    return this.db
      .prepare(`SELECT DISTINCT brand FROM vehicles WHERE status IN (${marks}) ORDER BY brand COLLATE NOCASE`)
      .all(...statuses)
      .map((row) => row.brand);
  }

  search({ statuses, q, brand, body, transmission, minPrice, maxPrice, minYear, maxYear, maxMileage, sort, limit, offset }) {
    const where = [`v.status IN (${statuses.map(() => '?').join(', ')})`];
    const params = [...statuses];

    if (q) {
      where.push("(v.brand LIKE ? ESCAPE '\\' OR v.model LIKE ? ESCAPE '\\' OR (v.brand || ' ' || v.model) LIKE ? ESCAPE '\\')");
      const like = `%${escapeLike(q)}%`;
      params.push(like, like, like);
    }

    const equals = { brand, body, transmission };
    Object.entries(equals).forEach(([column, value]) => {
      if (value) {
        where.push(`v.${column} = ? COLLATE NOCASE`);
        params.push(value);
      }
    });

    const ranges = [
      ['v.price >= ?', minPrice],
      ['v.price <= ?', maxPrice],
      ['v.year >= ?', minYear],
      ['v.year <= ?', maxYear],
      ['v.mileage <= ?', maxMileage],
    ];
    ranges.forEach(([clause, value]) => {
      if (value !== undefined) {
        where.push(clause);
        params.push(value);
      }
    });

    const whereSql = where.join(' AND ');
    const total = this.db.prepare(`SELECT COUNT(*) AS n FROM vehicles v WHERE ${whereSql}`).get(...params).n;
    const rows = this.db
      .prepare(`${BASE_SELECT} WHERE ${whereSql} ORDER BY ${SORTS[sort] || SORTS.recientes} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return { rows, total };
  }
}

module.exports = { VehicleModel, SORTS };
