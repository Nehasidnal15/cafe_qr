const bcrypt = require('bcrypt');
const db = require('./db');
const Admin = require('./models/Admin');

async function test() {
  const username = 'nehasidnal15.mca@gmail.com';
  const password = 'neha150703';

  const admin = await Admin.findByEmail(username);
  if (!admin) {
    console.log('Admin not found!');
    process.exit(1);
  }
  console.log('Found admin:', admin.email);
  console.log('Hash in DB:', admin.password);

  const isMatch = await bcrypt.compare(password, admin.password);
  console.log('Does password match?', isMatch);
  process.exit(0);
}
test();
