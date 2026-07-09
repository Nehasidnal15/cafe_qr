const db = require('./backend/db');
db.query("SELECT item->>'menuItemId' as id, item->>'name' as name, SUM((item->>'quantity')::int) as totalSold FROM orders, jsonb_array_elements(items::jsonb) as item GROUP BY item->>'menuItemId', item->>'name' ORDER BY totalSold DESC")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => process.exit());
