import express from 'express';
import { db } from '../lib/db.js';
import { authenticateToken, isAdmin } from './middleware.js';
import fs from 'fs';

const router = express.Router();

router.get('/users', authenticateToken, isAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, displayName, photoURL, plan, role, status, language, createdAt FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', authenticateToken, isAdmin, (req, res) => {
  const { plan, role, status } = req.body;
  const { id } = req.params;

  try {
    db.prepare(`
      UPDATE users 
      SET plan = ?, role = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `).run(plan, role, status, new Date().toISOString(), id);

    const user = db.prepare('SELECT id, email, displayName, photoURL, plan, role, status, language, createdAt FROM users WHERE id = ?').get(id);
    res.json(user);
    
    // Log action
    db.prepare(`
      INSERT INTO audit_logs (userId, action, details, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, 'update_user', JSON.stringify({ targetId: id, plan, role, status }), new Date().toISOString());
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/audit-logs', authenticateToken, isAdmin, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/backup/db', authenticateToken, isAdmin, (req, res) => {
  const dbPath = process.env.DATABASE_URL || './shinigami.db';
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, `shinigami-backup-${new Date().toISOString().split('T')[0]}.db`);
  } else {
    res.status(404).json({ error: 'Database file not found' });
  }
});

export default router;
