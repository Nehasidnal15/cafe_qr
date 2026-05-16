require('dotenv').config();
const db = require('./db');
const os = require('os');

// Helper to get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const frontendPort = '5173';

const updateQrs = async () => {
  try {
    console.log(`Connected to PostgreSQL. Updating URLs with IP: ${localIP}...`);
    
    // Quick query to get all tables
    const res = await db.query('SELECT * FROM tables');
    const tables = res.rows;
    console.log(`Found ${tables.length} tables. Updating URLs...`);
    
    for (const table of tables) {
      const newQrUrl = `http://${localIP}:${frontendPort}/login?table=${table.table_number}`;
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
