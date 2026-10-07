import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const storeId = req.query.store_id || 'caffe-pusat';
    const [rows] = await pool.query('SELECT * FROM categories WHERE store_id = ? ORDER BY display_order ASC', [storeId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories (Create)
router.post('/', async (req, res) => {
  try {
    const { id, name, slug, display_order, storeId } = req.body;
    const catId = id || 'cat-' + Date.now();
    const store = storeId || 'caffe-pusat';
    const catSlug = slug || (name ? name.toLowerCase().replace(/\s+/g, '-') : 'kategori');
    const orderNum = parseInt(display_order) || 1;

    await pool.query(
      'INSERT INTO categories (id, store_id, name, slug, display_order) VALUES (?, ?, ?, ?, ?)',
      [catId, store, name, catSlug, orderNum]
    );

    res.json({ success: true, category: { id: catId, storeId: store, name, slug: catSlug, display_order: orderNum } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id (Update)
router.put('/:id', async (req, res) => {
  try {
    const { name, slug, display_order } = req.body;
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, display_order = ? WHERE id = ?',
      [name, slug, display_order, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id (Delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
