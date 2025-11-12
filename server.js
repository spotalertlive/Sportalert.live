import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Static paths fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow static files:
app.use(express.static(__dirname));

app.use(cors());
app.use(bodyParser.json());

// All frontend requests for signup/login go through /api
app.use('/api', authRoutes);

// Default port if .env missing
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ SpotAlert FRONT-END server running on port ${PORT}`);
});
