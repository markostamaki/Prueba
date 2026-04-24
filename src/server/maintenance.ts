import express from 'express';
import { db } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let tasks;
    if (role === 'admin') {
      tasks = db.prepare('SELECT * FROM maintenance_tasks').all();
    } else {
      tasks = db.prepare('SELECT * FROM maintenance_tasks WHERE userId = ?').all(userId);
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  const { propertyId, title, description, status, priority, dueDate } = req.body;
  const userId = req.user.id;
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO maintenance_tasks (id, userId, propertyId, title, description, status, priority, dueDate, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, propertyId, title, description, status || 'pending', priority || 'medium', dueDate, createdAt);

    const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const existing = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (role !== 'admin' && existing.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare(`
      UPDATE maintenance_tasks 
      SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, updatedAt = ?
      WHERE id = ?
    `).run(title, description, status, priority, dueDate, new Date().toISOString(), id);

    const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const existing = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (role !== 'admin' && existing.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare('DELETE FROM maintenance_tasks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
