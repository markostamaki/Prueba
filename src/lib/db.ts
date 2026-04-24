import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_URL || './shinigami.db';
export const db = new Database(dbPath);

export function initDB() {
  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT,
      photoURL TEXT,
      plan TEXT DEFAULT 'free',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      language TEXT DEFAULT 'en',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Create Properties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      description TEXT,
      rentAmount REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (ownerId) REFERENCES users (id)
    )
  `);

  // Create Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      propertyId TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      receiptUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (propertyId) REFERENCES properties (id)
    )
  `);

  // Create Maintenance Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      propertyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      dueDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (propertyId) REFERENCES properties (id)
    )
  `);

  // Create Audit Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Bootstrap Admin User if it doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL || 'markostamaki23@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (process.env.NODE_ENV === 'production') {
    if (adminPassword === 'admin123' || adminPassword.includes('PLACEHOLDER')) {
      console.error('FATAL: ADMIN_PASSWORD must be changed from the default/placeholder in production.');
      process.exit(1);
    }
  }
  
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO users (id, email, password, displayName, role, plan, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin-id-1',
      adminEmail,
      hashedPassword,
      'Admin User',
      'admin',
      'premium',
      'active',
      new Date().toISOString()
    );
    console.log('Admin user bootstrapped');
  }
}
