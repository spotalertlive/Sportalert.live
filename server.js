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

const app = express();

// Enable CORS + JSON
app.use(cors());
app.use(bodyParser.json());

// Serve ALL static front-end files
app.use(express.static(__dirname, { extensions: ['html'] }));

// Auth API routes
app.use('/api/auth', authRoutes);

// Direct HTML route fixes:
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Email verification pages
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify.html'));
});

app.get('/verify-expired', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify-expired.html'));
});

app.get('/resend-verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'resend-verification.html'));
});

// PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ SpotAlert FRONT-END running on port ${PORT}`);
});
