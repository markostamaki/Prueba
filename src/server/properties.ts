import express from 'express';
import { db } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let properties;
    if (role === 'admin') {
      properties = db.prepare('SELECT * FROM properties').all();
    } else {
      properties = db.prepare('SELECT * FROM properties WHERE ownerId = ?').all(userId);
    }
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  const { name, address, type, description, rentAmount } = req.body;
  const userId = req.user.id;
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO properties (id, ownerId, name, address, type, description, rentAmount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, name, address, type, description, rentAmount, createdAt);

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  const { name, address, type, status, description, rentAmount } = req.body;
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Property not found' });
    if (role !== 'admin' && existing.ownerId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare(`
      UPDATE properties 
      SET name = ?, address = ?, type = ?, status = ?, description = ?, rentAmount = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, address, type, status, description, rentAmount, new Date().toISOString(), id);

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Property not found' });
    if (role !== 'admin' && existing.ownerId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export default router;
