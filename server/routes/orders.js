import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/orders (Fetch all orders with items & variants)
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, t.table_number, p.payment_method, p.payment_status, p.amount_paid, p.change_amount
       FROM orders o
       JOIN tables t ON o.table_id = t.id
       LEFT JOIN payments p ON p.order_id = o.id
       ORDER BY o.created_at DESC`
    );

    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id`
    );

    const [itemVariants] = await pool.query('SELECT * FROM order_item_variants');

    const formattedOrders = orders.map(ord => {
      const ordItems = items.filter(i => i.order_id === ord.id).map(i => {
        const variants = itemVariants.filter(iv => iv.order_item_id === i.id).map(iv => iv.variant_name);
        return {
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unit_price) || 0,
          subtotal: parseFloat(i.subtotal) || 0,
          selectedVariants: variants,
          notes: i.item_notes
        };
      });

      return {
        id: ord.id,
        orderNumber: ord.order_number,
        tableNumber: ord.table_number,
        tableToken: ord.table_id,
        customerName: ord.customer_name,
        orderType: ord.order_type,
        status: ord.status, // 'pending_payment', 'preparing', 'ready', 'completed'
        paymentStatus: ord.payment_status || 'unpaid',
        paymentMethod: ord.payment_method || 'cash',
        amountPaid: ord.amount_paid ? parseFloat(ord.amount_paid) : null,
        changeAmount: ord.change_amount ? parseFloat(ord.change_amount) : 0,
        createdAt: ord.created_at,
        subtotal: parseFloat(ord.subtotal) || 0,
        tax: parseFloat(ord.tax_amount) || 0,
        total: parseFloat(ord.total_amount) || 0,
        items: ordItems
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders (Create new customer order)
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      id, orderNumber, tableNumber, customerName, orderType,
      status, paymentStatus, paymentMethod, subtotal, tax, total, items
    } = req.body;

    const ordId = id || 'ord-' + Date.now();

    // Resolve table_id
    const [tbls] = await connection.query('SELECT id FROM tables WHERE table_number = ?', [tableNumber]);
    const tableId = tbls.length > 0 ? tbls[0].id : 'tbl-1';

    // Insert Order Header
    await connection.query(
      `INSERT INTO orders (id, order_number, table_id, customer_name, order_type, status, subtotal, tax_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ordId, orderNumber, tableId, customerName || 'Guest', orderType || 'dine_in', status || 'pending', subtotal, tax, total]
    );

    // Insert Payment Record
    await connection.query(
      `INSERT INTO payments (id, order_id, payment_method, payment_status, amount_paid, change_amount, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'pay-' + Date.now(),
        ordId,
        paymentMethod || 'cash',
        paymentStatus || 'unpaid',
        paymentStatus === 'paid' ? total : 0,
        0,
        paymentStatus === 'paid' ? new Date() : null
      ]
    );

    // Insert Order Items & Item Variants
    for (const item of items) {
      const itemId = 'item-' + Math.random().toString(36).substr(2, 9);
      await connection.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, item_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, ordId, item.productId, item.quantity, item.unitPrice, item.unitPrice * item.quantity, item.notes || '']
      );

      if (item.selectedVariants && item.selectedVariants.length > 0) {
        for (const vName of item.selectedVariants) {
          await connection.query(
            `INSERT INTO order_item_variants (id, order_item_id, variant_group, variant_name, extra_price)
             VALUES (?, ?, ?, ?, ?)`,
            ['oiv-' + Math.random().toString(36).substr(2, 9), itemId, 'Custom', vName, 0]
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true, id: ordId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// PATCH /api/orders/:id/status (Update order status: preparing -> ready -> completed)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/pay-cash (Process Cash Payment)
router.post('/:id/pay-cash', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { amountPaid, changeAmount } = req.body;

    // Update Payment Status
    await connection.query(
      `UPDATE payments 
       SET payment_status = 'paid', amount_paid = ?, change_amount = ?, paid_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [amountPaid, changeAmount, id]
    );

    // Update Order Status to 'preparing' (sent to kitchen)
    await connection.query(
      `UPDATE orders SET status = 'preparing' WHERE id = ?`,
      [id]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
