import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/products (Fetch products with variants grouped)
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE is_available = TRUE');

    // Group variants by product_id
    const productsWithVariants = products.map(prod => {
      const prodVariants = variants.filter(v => v.product_id === prod.id);
      
      // Group variants by variant_group
      const groupsMap = {};
      prodVariants.forEach(v => {
        if (!groupsMap[v.variant_group]) {
          groupsMap[v.variant_group] = {
            group: v.variant_group,
            name: v.variant_group === 'Temperature' ? 'Suhu' : 
                  v.variant_group === 'SugarLevel' ? 'Tingkat Manis' : 
                  v.variant_group === 'Topping' ? 'Extra Topping' : v.variant_group,
            options: []
          };
        }
        groupsMap[v.variant_group].options.push({
          label: v.variant_name,
          extraPrice: parseFloat(v.extra_price) || 0
        });
      });

      return {
        id: prod.id,
        categoryId: prod.category_id,
        name: prod.name,
        description: prod.description,
        price: parseFloat(prod.price) || 0,
        imageUrl: prod.image_url,
        isAvailable: Boolean(prod.is_available),
        variants: Object.values(groupsMap)
      };
    });

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products (Create product)
router.post('/', async (req, res) => {
  try {
    const { id, categoryId, name, description, price, imageUrl, isAvailable } = req.body;
    const prodId = id || 'prod-' + Date.now();

    await pool.query(
      `INSERT INTO products (id, category_id, name, description, price, image_url, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [prodId, categoryId || 'coffee', name, description || '', price || 0, imageUrl || '', isAvailable !== false]
    );

    res.json({ success: true, id: prodId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id (Update product)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;

    await pool.query(
      `UPDATE products 
       SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ?
       WHERE id = ?`,
      [categoryId, name, description, price, imageUrl, isAvailable, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id/toggle-availability
router.patch('/:id/toggle-availability', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET is_available = NOT is_available WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
