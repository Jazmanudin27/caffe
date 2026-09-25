import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import tablesRouter from './routes/tables.js';
import ordersRouter from './routes/orders.js';
import reportsRouter from './routes/reports.js';
import authRouter from './routes/auth.js';
import { runMigration } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes (Registered with both /api/ and / for Nginx proxy flexibility)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/categories', categoriesRouter);
app.use('/categories', categoriesRouter);

app.use('/api/products', productsRouter);
app.use('/products', productsRouter);

app.use('/api/tables', tablesRouter);
app.use('/tables', tablesRouter);

app.use('/api/orders', ordersRouter);
app.use('/orders', ordersRouter);

app.use('/api/reports', reportsRouter);
app.use('/reports', reportsRouter);

// Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'Caffe POS API', timestamp: new Date() });
});

// Fallback 404 JSON Handler
app.use((req, res) => {
  res.status(404).json({ error: `Rute ${req.originalUrl} tidak ditemukan pada Caffe POS API` });
});

// Auto run migration & start server
async function startServer() {
  try {
    await runMigration();
    app.listen(PORT, () => {
      console.log(`🚀 Caffe POS API Backend is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
