import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDB, db } from './src/lib/db.js';
import authRoutes from './src/server/auth.js';
import propertyRoutes from './src/server/properties.js';
import expenseRoutes from './src/server/expenses.js';
import maintenanceRoutes from './src/server/maintenance.js';
import adminRoutes from './src/server/admin.js';
import uploadRoutes from './src/server/uploads.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure upload directory exists
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Validate critical environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'super-secret-key' || jwtSecret.includes('PLACEHOLDER')) {
      console.error('FATAL: JWT_SECRET is not set or is using a weak placeholder in production.');
      process.exit(1);
    }
  }

  // Initialize Database
  initDB();

  app.use(cors());
  app.use(express.json());

  // Static files for uploads
  app.use('/uploads', express.static(uploadDir));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Intranet Mode: ${process.env.INTRANET_MODE}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
