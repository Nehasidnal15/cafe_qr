const db = require('./db');

async function test() {
  try {
    const res = await db.query('SELECT * FROM tables');
    console.log('tables:', res.rows);
  } catch (e) {
    console.log('tables error:', e.message);
  }
  process.exit(0);
}
test();
