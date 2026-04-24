import express from 'express';
import { db } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let expenses;
    if (role === 'admin') {
      expenses = db.prepare('SELECT * FROM expenses').all();
    } else {
      expenses = db.prepare('SELECT * FROM expenses WHERE userId = ?').all(userId);
    }
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  const { propertyId, amount, category, date, description, receiptUrl } = req.body;
  const userId = req.user.id;
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO expenses (id, userId, propertyId, amount, category, date, description, receiptUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, propertyId, amount, category, date, description, receiptUrl, createdAt);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (role !== 'admin' && existing.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
