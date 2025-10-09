import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../utils/sendEmail.js';
import { createVerificationToken, verifyToken } from '../utils/tokenManager.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Verify email link
router.get('/verify', (req, res) => {
  const token = req.query.token;
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.sendFile(path.join(__dirname, '../emails/verify-expired.html'));
  }

  // TODO: Mark user as verified in database
  return res.sendFile(path.join(__dirname, '../emails/verified-success.html'));
});

// Resend verification email
router.post('/resend', async (req, res) => {
  const { email } = req.body;
  const token = createVerificationToken(email);
  const verifyUrl = `${process.env.BASE_URL}/verify?token=${token}`;

  try {
    await sendEmail(
      email,
      'Verify your SpotAlert account',
      path.join(__dirname, '../emails/verify.html'),
      { verify_url: verifyUrl, first_name: 'User' }
    );
    res.json({ success: true, message: 'Verification email resent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending email.' });
  }
});

export default router;
