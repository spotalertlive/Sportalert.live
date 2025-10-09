import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`✅ SpotAlert backend running on port ${process.env.PORT}`);
});
