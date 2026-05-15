const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.findAll();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new table
router.post('/', async (req, res) => {
  const { tableNumber, qrUrl } = req.body;
  try {
    const existing = await Table.findByTableNumber(tableNumber);
    if (existing) {
      return res.status(400).json({ message: 'Table already exists' });
    }
    const table = await Table.create(tableNumber, qrUrl);
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a table
router.delete('/:id', async (req, res) => {
  try {
    await Table.delete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
