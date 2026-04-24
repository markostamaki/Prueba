import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password, displayName, createdAt, role, plan, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, displayName || email.split('@')[0], createdAt, 'user', 'free', 'active');

    const user = { id: userId, email, displayName, role: 'user', plan: 'free' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const userData = { 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName, 
      role: user.role, 
      plan: user.plan,
      photoURL: user.photoURL,
      language: user.language
    };
    
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
