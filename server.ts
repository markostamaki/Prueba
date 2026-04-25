import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB Initialization
const dbPath = process.env.DATABASE_URL || "local.db";
const dbDir = path.dirname(dbPath);
if (dbDir !== "." && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    language TEXT DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    address TEXT,
    type TEXT,
    monthlyRent REAL,
    status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    userId TEXT,
    propertyId TEXT,
    category TEXT,
    amount REAL,
    date TEXT,
    description TEXT,
    receiptUrl TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(propertyId) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    userId TEXT,
    propertyId TEXT,
    title TEXT,
    description TEXT,
    scheduledDate TEXT,
    priority TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(propertyId) REFERENCES properties(id)
  );
`);

const JWT_SECRET = process.env.JWT_SECRET || "property-management-secret-key";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      res.status(403).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = Math.random().toString(36).substring(2, 11);
      
      const insert = db.prepare("INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)");
      insert.run(userId, email, hashedPassword, full_name);
      
      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, email, full_name, role: 'user', plan: 'free', status: 'active' } });
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("UNIQUE")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Error creating user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPass = await bcrypt.compare(password, user.password);
      if (!validPass) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          full_name: user.full_name, 
          role: user.role, 
          plan: user.plan, 
          status: user.status,
          language: user.language
        } 
      });
    } catch (err) {
      res.status(500).json({ error: "Error logging in" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    try {
      const user: any = db.prepare("SELECT id, email, full_name, role, plan, status, language FROM users WHERE id = ?").get(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Error fetching profile" });
    }
  });

  // Properties API
  app.get("/api/properties", authenticateToken, (req: any, res) => {
    const rows = db.prepare("SELECT * FROM properties WHERE userId = ?").all(req.user.id);
    res.json(rows);
  });

  app.post("/api/properties", authenticateToken, (req: any, res) => {
    const { name, address, type, monthlyRent, status, notes } = req.body;
    const id = Math.random().toString(36).substring(2, 11);
    const insert = db.prepare("INSERT INTO properties (id, userId, name, address, type, monthlyRent, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run(id, req.user.id, name, address, type, monthlyRent, status, notes);
    res.json({ id, name, address, type, monthlyRent, status, notes });
  });

  app.put("/api/properties/:id", authenticateToken, (req: any, res) => {
    const { name, address, type, monthlyRent, status, notes } = req.body;
    const update = db.prepare("UPDATE properties SET name=?, address=?, type=?, monthlyRent=?, status=?, notes=? WHERE id=? AND userId=?");
    update.run(name, address, type, monthlyRent, status, notes, req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.delete("/api/properties/:id", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM properties WHERE id=? AND userId=?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Expenses API
  app.get("/api/expenses", authenticateToken, (req: any, res) => {
    const rows = db.prepare("SELECT * FROM expenses WHERE userId = ?").all(req.user.id);
    res.json(rows);
  });

  app.post("/api/expenses", authenticateToken, (req: any, res) => {
    const { propertyId, category, amount, date, description } = req.body;
    const id = Math.random().toString(36).substring(2, 11);
    const insert = db.prepare("INSERT INTO expenses (id, userId, propertyId, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)");
    insert.run(id, req.user.id, propertyId, category, amount, date, description);
    res.json({ id, propertyId, category, amount, date, description });
  });

  // Tasks API
  app.get("/api/tasks", authenticateToken, (req: any, res) => {
    const rows = db.prepare("SELECT * FROM maintenance_tasks WHERE userId = ?").all(req.user.id);
    res.json(rows);
  });

  app.post("/api/tasks", authenticateToken, (req: any, res) => {
    const { propertyId, title, description, scheduledDate, priority, status } = req.body;
    const id = Math.random().toString(36).substring(2, 11);
    const insert = db.prepare("INSERT INTO maintenance_tasks (id, userId, propertyId, title, description, scheduledDate, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run(id, req.user.id, propertyId, title, description, scheduledDate, priority, status);
    res.json({ id, propertyId, title, description, scheduledDate, priority, status });
  });

  app.patch("/api/tasks/:id", authenticateToken, (req: any, res) => {
    const { status } = req.body;
    db.prepare("UPDATE maintenance_tasks SET status=? WHERE id=? AND userId=?").run(status, req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "connected" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Admin routes
app.get("/api/admin/users", authenticateToken, (req, res) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  const users = db.prepare("SELECT id, email, fullName, role, plan, status, language, createdAt FROM users").all();
  res.json(users);
});

app.get("/api/admin/properties", authenticateToken, (req, res) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  const properties = db.prepare("SELECT * FROM properties").all();
  res.json(properties);
});

app.get("/api/admin/expenses", authenticateToken, (req, res) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  const expenses = db.prepare("SELECT * FROM expenses").all();
  res.json(expenses);
});

app.put("/api/admin/users/:id", authenticateToken, (req, res) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { role, plan, status } = req.body;
  const { id } = req.params;

  const stmt = db.prepare("UPDATE users SET role = COALESCE(?, role), plan = COALESCE(?, plan), status = COALESCE(?, status) WHERE id = ?");
  stmt.run(role, plan, status, id);
  res.json({ message: "User updated" });
});

app.delete("/api/admin/users/:id", authenticateToken, (req, res) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { id } = req.params;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ message: "User deleted" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
