import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/tables
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
    const formatted = rows.map(t => ({
      id: t.id,
      number: t.table_number,
      token: t.qr_code_token,
      capacity: t.capacity,
      status: t.status
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
