const db = require('../db');

const mapMenuItem = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    category: row.category,
    imageUrl: row.image,
    isAvailable: row.is_available,
    type: row.food_type,
    createdAt: row.created_at
  };
};

const MenuItem = {
  findAll: async () => {
    const result = await db.query('SELECT * FROM menu ORDER BY category, name');
    return result.rows.map(mapMenuItem);
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM menu WHERE id = $1', [id]);
    return mapMenuItem(result.rows[0]);
  },

  create: async (data) => {
    const { name, description, price, category, type, isAvailable, imageUrl } = data;
    const result = await db.query(
      `INSERT INTO menu (name, description, price, category, food_type, is_available, image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price, category, type, isAvailable, imageUrl]
    );
    return mapMenuItem(result.rows[0]);
  },

  update: async (id, data) => {
    const { name, description, price, category, type, isAvailable, imageUrl } = data;
    const result = await db.query(
      `UPDATE menu 
       SET name = $1, description = $2, price = $3, category = $4, food_type = $5, is_available = $6, image = $7
       WHERE id = $8 RETURNING *`,
      [name, description, price, category, type, isAvailable, imageUrl, id]
    );
    return mapMenuItem(result.rows[0]);
  },

  updateAvailability: async (id, isAvailable) => {
    const result = await db.query(
      'UPDATE menu SET is_available = $1 WHERE id = $2 RETURNING *',
      [isAvailable, id]
    );
    return mapMenuItem(result.rows[0]);
  },

  delete: async (id) => {
    const result = await db.query('DELETE FROM menu WHERE id = $1 RETURNING *', [id]);
    return mapMenuItem(result.rows[0]);
  }
};

module.exports = MenuItem;
