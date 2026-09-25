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
import { runMigration } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Caffe POS API', timestamp: new Date() });
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
