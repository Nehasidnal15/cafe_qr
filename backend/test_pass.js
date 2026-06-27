const bcrypt = require('bcrypt');

async function test() {
  const hash = '$2b$10$XbLrskBB.jkIoDG64ruCY.w5A5mD6WG98uclX6D9Ucy5okCeDcEUe';
  const isMatch1 = await bcrypt.compare('neha9806', hash);
  const isMatch2 = await bcrypt.compare('admin', hash);
  const isMatch3 = await bcrypt.compare('admin123', hash);
  console.log('neha9806 match?', isMatch1);
  console.log('admin match?', isMatch2);
  console.log('admin123 match?', isMatch3);
  process.exit(0);
}
test();
