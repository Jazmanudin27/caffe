import express from 'express';
import pool from '../db.js';

const router = express.Router();

// POST /api/auth/check-phone (Check if phone exists or register/login)
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Nomor HP wajib diisi' });
    }

    const cleanPhone = phone.trim();
    const [rows] = await pool.query('SELECT id, name, phone, role FROM users WHERE phone = ?', [cleanPhone]);

    if (rows.length > 0) {
      // User found
      return res.json({ registered: true, user: rows[0] });
    } else {
      // User not registered yet
      return res.json({ registered: false, phone: cleanPhone });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register-customer (Register new customer with Name & Phone)
router.post('/register-customer', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nama Lengkap dan Nomor HP wajib diisi' });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const userId = 'usr-' + Date.now();

    // Check if phone already registered
    const [existing] = await pool.query('SELECT id, name, phone, role FROM users WHERE phone = ?', [cleanPhone]);
    if (existing.length > 0) {
      return res.json({ success: true, user: existing[0] });
    }

    // Insert new customer
    await pool.query(
      `INSERT INTO users (id, name, phone, password_hash, role, is_active)
       VALUES (?, ?, ?, '', 'customer', TRUE)`,
      [userId, cleanName, cleanPhone]
    );

    const newUser = { id: userId, name: cleanName, phone: cleanPhone, role: 'customer' };
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
