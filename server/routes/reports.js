import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/reports/financial
router.get('/financial', async (req, res) => {
  try {
    const [totals] = await pool.query(
      `SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.subtotal) as total_subtotal,
        SUM(o.tax_amount) as total_tax,
        SUM(o.total_amount) as total_revenue
       FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'paid' OR o.status = 'completed'`
    );

    const [paymentStats] = await pool.query(
      `SELECT p.payment_method, SUM(o.total_amount) as revenue
       FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'paid' OR o.status = 'completed'
       GROUP BY p.payment_method`
    );

    const [topProducts] = await pool.query(
      `SELECT p.name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       JOIN payments pay ON pay.order_id = o.id
       WHERE pay.payment_status = 'paid' OR o.status = 'completed'
       GROUP BY p.id, p.name
       ORDER BY total_qty DESC
       LIMIT 5`
    );

    res.json({
      summary: totals[0] || {},
      paymentStats,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
