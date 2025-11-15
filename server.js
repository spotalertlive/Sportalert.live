import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FINAL: Frontend build directory
const FRONTEND_DIR = path.join(__dirname, 'public');   // <-- IMPORTANT

const app = express();

// Enable CORS + JSON
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(FRONTEND_DIR));

// API Routes
app.use('/api/auth', authRoutes);

// HTML Routes (correct location)
app.get('/signup', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'dashboard.html'));
});

// Email verification pages
app.get('/verify', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'verify.html'));
});

app.get('/verify-expired', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'verify-expired.html'));
});

app.get('/resend-verification', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'resend-verification.html'));
});

// FRONTEND FALLBACK (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ SpotAlert FRONT-END running on port ${PORT}`);
});
