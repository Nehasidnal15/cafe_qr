const db = require('./db');
const bcrypt = require('bcrypt');

const updatePassword = async () => {
  try {
    const hash = await bcrypt.hash('neha150703', 10);
    await db.query('UPDATE admin SET password = $1 WHERE email = $2', [hash, 'nehasidnal15.mca@gmail.com']);
    console.log('Password updated with hash successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
};

updatePassword();
