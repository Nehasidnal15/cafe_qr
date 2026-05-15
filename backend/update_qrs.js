require('dotenv').config();
const db = require('./db');
const Table = require('./models/Table');

const localIP = '192.168.0.167';
const frontendPort = '5173';

const updateQrs = async () => {
  try {
    console.log('Connected to PostgreSQL. Updating URLs...');
    
    const tables = await Table.findAll();
    console.log(`Found ${tables.length} tables. Updating URLs...`);
    
    for (const table of tables) {
      const newQrUrl = `http://${localIP}:${frontendPort}/login?table=${table.tableNumber}`;
      // Note: I need to add an update method to Table model if I want to update existing rows.
      // Or just use db.query directly.
      await db.query('UPDATE tables SET qr_url = $1 WHERE id = $2', [newQrUrl, table.id]);
      console.log(`Updated Table ${table.tableNumber} QR URL to: ${newQrUrl}`);
    }
    
    console.log('All table QR URLs updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

updateQrs();
