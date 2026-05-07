import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('patient', 'doctor', 'admin'))
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    specialty TEXT,
    contact TEXT,
    location TEXT,
    clinicName TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER,
    fileName TEXT,
    originalName TEXT,
    analysisResult TEXT,
    recommendedDoctorId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES users(id),
    FOREIGN KEY (recommendedDoctorId) REFERENCES doctors(id)
  );
`);

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  next();
};

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, role);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ token, role: user.role });
});

// User Info
app.get('/api/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// Doctor Management (Admin only)
app.post('/api/doctors', authenticateToken, isAdmin, (req, res) => {
  const { name, specialty, contact, location, clinicName } = req.body;
  const stmt = db.prepare('INSERT INTO doctors (name, specialty, contact, location, clinicName) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, specialty, contact, location, clinicName);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/doctors', authenticateToken, (req, res) => {
  const doctors = db.prepare('SELECT * FROM doctors').all();
  res.json(doctors);
});

// Report Management
app.post('/api/reports', authenticateToken, upload.single('report'), (req: any, res) => {
  const { analysisResult, recommendedDoctorId } = req.body;
  const patientId = req.user.id;
  const fileName = req.file?.filename;
  const originalName = req.file?.originalname;

  const stmt = db.prepare('INSERT INTO reports (patientId, fileName, originalName, analysisResult, recommendedDoctorId) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(patientId, fileName, originalName, JSON.stringify(analysisResult), recommendedDoctorId || null);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/history', authenticateToken, (req: any, res) => {
  let reports;
  if (req.user.role === 'admin') {
    reports = db.prepare(`
      SELECT r.*, u.username as patientName, d.name as doctorName 
      FROM reports r 
      JOIN users u ON r.patientId = u.id 
      LEFT JOIN doctors d ON r.recommendedDoctorId = d.id
      ORDER BY r.createdAt DESC
    `).all();
  } else if (req.user.role === 'doctor') {
    // Doctors view all reports (per requirement: can view by patient, doctor and admin)
    reports = db.prepare(`
      SELECT r.*, u.username as patientName, d.name as doctorName 
      FROM reports r 
      JOIN users u ON r.patientId = u.id 
      LEFT JOIN doctors d ON r.recommendedDoctorId = d.id
      ORDER BY r.createdAt DESC
    `).all();
  } else {
    reports = db.prepare(`
      SELECT r.*, u.username as patientName, d.name as doctorName 
      FROM reports r 
      JOIN users u ON r.patientId = u.id 
      LEFT JOIN doctors d ON r.recommendedDoctorId = d.id
      WHERE r.patientId = ?
      ORDER BY r.createdAt DESC
    `).all(req.user.id);
  }
  res.json(reports);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
