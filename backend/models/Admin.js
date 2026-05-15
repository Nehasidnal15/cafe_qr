const db = require('../db');

const mapAdmin = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    otp: row.otp,
    otpExpiry: row.otp_expiry,
    createdAt: row.created_at
  };
};

const Admin = {
  findByEmail: async (email) => {
    const result = await db.query('SELECT * FROM admin WHERE email = $1', [email]);
    return mapAdmin(result.rows[0]);
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM admin WHERE id = $1', [id]);
    return mapAdmin(result.rows[0]);
  },

  count: async () => {
    const result = await db.query('SELECT COUNT(*) FROM admin');
    return parseInt(result.rows[0].count);
  },

  updateOTP: async (email, otp, expiry) => {
    await db.query(
      'UPDATE admin SET otp = $1, otp_expiry = $2 WHERE email = $3',
      [otp, expiry, email]
    );
  },

  clearOTP: async (email) => {
    await db.query('UPDATE admin SET otp = NULL, otp_expiry = NULL WHERE email = $1', [email]);
  },

  updatePassword: async (email, passwordHash) => {
    await db.query('UPDATE admin SET password = $1 WHERE email = $2', [passwordHash, email]);
  }
};

module.exports = Admin;
