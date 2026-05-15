const db = require('../db');

const mapOrder = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    tableNumber: row.table_number,
    items: row.items,
    totalAmount: parseFloat(row.total_amount),
    paymentMode: row.payment_mode,
    status: row.status,
    cancelReason: row.cancel_reason,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const Order = {
  findAll: async (query = {}) => {
    let sql = 'SELECT * FROM orders';
    const params = [];
    
    if (query.createdAt) {
      sql += ' WHERE created_at >= $1 AND created_at <= $2';
      params.push(query.createdAt.$gte, query.createdAt.$lte);
    }
    
    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);
    return result.rows.map(mapOrder);
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    return mapOrder(result.rows[0]);
  },

  findByOrderId: async (orderId) => {
    const result = await db.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    return mapOrder(result.rows[0]);
  },

  create: async (data) => {
    const { orderId, customerName, customerPhone, tableNumber, items, totalAmount, paymentMode } = data;
    const result = await db.query(
      `INSERT INTO orders (order_id, customer_name, customer_phone, table_number, items, total_amount, payment_mode, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Placed') RETURNING *`,
      [orderId, customerName, customerPhone, tableNumber, JSON.stringify(items), totalAmount, paymentMode]
    );
    return mapOrder(result.rows[0]);
  },

  save: async (order) => {
    const { id, status, cancelReason, cancelledAt, totalAmount, items } = order;
    const result = await db.query(
      `UPDATE orders 
       SET status = $1, cancel_reason = $2, cancelled_at = $3, total_amount = $4, items = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [status, cancelReason, cancelledAt, totalAmount, JSON.stringify(items), id]
    );
    return mapOrder(result.rows[0]);
  },

  updateStatus: async (id, status) => {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return mapOrder(result.rows[0]);
  }
};

module.exports = Order;
