const db = require('../db');

const mapTable = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    tableNumber: row.table_number,
    qrUrl: row.qr_url,
    createdAt: row.created_at
  };
};

const Table = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM tables ORDER BY table_number');
    return result.rows.map(mapTable);
  },

  findByTableNumber: async (tableNumber) => {
    const result = await db.query('SELECT * FROM tables WHERE table_number = $1', [tableNumber]);
    return mapTable(result.rows[0]);
  },

  create: async (tableNumber, qrUrl) => {
    const result = await db.query(
      'INSERT INTO tables (table_number, qr_url) VALUES ($1, $2) RETURNING *',
      [tableNumber, qrUrl]
    );
    return mapTable(result.rows[0]);
  },

  delete: async (id) => {
    const result = await db.query('DELETE FROM tables WHERE id = $1 RETURNING *', [id]);
    return mapTable(result.rows[0]);
  }
};

module.exports = Table;
