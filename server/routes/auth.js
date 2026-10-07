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

// POST /api/auth/staff-login (Authenticates staff and auto-detects role from MySQL database)
router.post('/staff-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan Password wajib diisi' });
    }

    const cleanUser = username.trim().toLowerCase();

    // Query MySQL database for user by email, name, id, or phone
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active FROM users 
       WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(id) = ? OR phone = ? LIMIT 1`,
      [cleanUser, cleanUser, cleanUser, cleanUser]
    );

    if (rows.length > 0) {
      const user = rows[0];
      if (!user.is_active) {
        return res.status(403).json({ error: 'Akun ini sedang tidak aktif' });
      }
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role === 'cashier' ? 'cashier' : user.role === 'kitchen' ? 'kitchen' : 'admin',
          loggedInAt: new Date().toISOString()
        }
      });
    }

    // Fallback: If user not in DB, infer role from username pattern
    let inferredRole = 'cashier';
    let displayName = username.trim();

    if (cleanUser.includes('admin')) {
      inferredRole = 'admin';
      displayName = 'Administrator';
    } else if (cleanUser.includes('dapur') || cleanUser.includes('kitchen') || cleanUser.includes('barista')) {
      inferredRole = 'kitchen';
      displayName = 'Barista & Dapur';
    } else if (cleanUser.includes('kasir') || cleanUser.includes('cashier')) {
      inferredRole = 'cashier';
      displayName = 'Kasir POS';
    }

    return res.json({
      success: true,
      user: {
        id: 'usr-' + Date.now(),
        name: displayName,
        username: username.trim(),
        role: inferredRole,
        loggedInAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
