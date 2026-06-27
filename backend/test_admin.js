const db = require('./db');

async function test() {
  try {
    const res1 = await db.query('SELECT * FROM admin');
    console.log('admin table:', res1.rows);
  } catch (e) {
    console.log('admin table error:', e.message);
  }

  try {
    const res2 = await db.query('SELECT * FROM admins');
    console.log('admins table:', res2.rows);
  } catch (e) {
    console.log('admins table error:', e.message);
  }
  process.exit(0);
}
test();
