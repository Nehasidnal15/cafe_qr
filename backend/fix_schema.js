const db = require('./db');

const fixSchema = async () => {
  try {
    console.log('Dropping old tables...');
    await db.query('DROP TABLE IF EXISTS order_items');
    await db.query('DROP TABLE IF EXISTS orders');
    await db.query('DROP TABLE IF EXISTS tables');
    
    console.log('Recreating tables with correct schema...');
    
    // Tables Table
    await db.query(`
      CREATE TABLE tables (
        id SERIAL PRIMARY KEY,
        table_number INTEGER UNIQUE NOT NULL,
        qr_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders Table
    await db.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        table_number VARCHAR(10) NOT NULL,
        items JSONB NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_mode VARCHAR(20) CHECK (payment_mode IN ('Online', 'Cash')) NOT NULL,
        status VARCHAR(50) DEFAULT 'Placed',
        cancel_reason TEXT,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fix Menu Table
    console.log('Fixing menu table schema...');
    await db.query(`
      ALTER TABLE menu 
      ADD COLUMN IF NOT EXISTS food_type VARCHAR(50) DEFAULT 'veg'
    `);

    console.log('Schema fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing schema:', err);
    process.exit(1);
  }
};

fixSchema();
