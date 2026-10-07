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

// POST /api/tables (Create)
router.post('/', async (req, res) => {
  try {
    const { number, capacity, status } = req.body;
    const tblId = 'tbl-' + Date.now();
    const cleanNumber = number ? (number.startsWith('M-') ? number : `M-${number.toString().padStart(2, '0')}`) : 'M-99';
    const qrToken = `QR-CAFFE-${cleanNumber.replace('-', '')}`;
    const capNum = parseInt(capacity) || 4;
    const tblStatus = status || 'available';

    await pool.query(
      'INSERT INTO tables (id, table_number, qr_code_token, capacity, status) VALUES (?, ?, ?, ?, ?)',
      [tblId, cleanNumber, qrToken, capNum, tblStatus]
    );

    res.json({
      success: true,
      table: { id: tblId, number: cleanNumber, token: qrToken, capacity: capNum, status: tblStatus }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tables/:id (Update)
router.put('/:id', async (req, res) => {
  try {
    const { number, capacity, status } = req.body;
    const cleanNumber = number ? (number.startsWith('M-') ? number : `M-${number.toString().padStart(2, '0')}`) : 'M-99';
    const qrToken = `QR-CAFFE-${cleanNumber.replace('-', '')}`;
    const capNum = parseInt(capacity) || 4;

    await pool.query(
      'UPDATE tables SET table_number = ?, qr_code_token = ?, capacity = ?, status = ? WHERE id = ?',
      [cleanNumber, qrToken, capNum, status, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tables/:id (Delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tables WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
