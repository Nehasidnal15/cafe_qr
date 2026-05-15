const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/top-dishes', async (req, res) => {
  try {
    const { range } = req.query;
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '2days') {
      startDate.setDate(startDate.getDate() - 2);
    } else if (range === '15days') {
      startDate.setDate(startDate.getDate() - 15);
    } else if (range === '1month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setHours(0, 0, 0, 0); // Default to today
    }

    const sql = `
      SELECT 
          item->>'menuItemId' as id, 
          item->>'name' as name, 
          SUM((item->>'quantity')::int) as "totalSold"
      FROM 
          orders, 
          jsonb_array_elements(items) as item
      WHERE 
          created_at >= $1 
          AND status != 'Cancelled' 
          AND item->>'status' != 'Cancelled'
      GROUP BY 
          item->>'menuItemId', item->>'name'
      ORDER BY 
          "totalSold" DESC
    `;

    const result = await db.query(sql, [startDate]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
