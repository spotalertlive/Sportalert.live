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

// === Signup route ===
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Create token for verification
    const token = createVerificationToken(email);
    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;

    // Send welcome + verification email
    await sendEmail(
      email,
      "Welcome to SpotAlert – Verify Your Account",
      path.join(__dirname, "../emails/verify.html"),
      { verify_url: verifyUrl, first_name: name }
    );

    console.log(`✅ Signup success: ${email}`);
    res.json({ success: true, message: "Account created! Check your email to verify." });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

// === Verify email link ===
router.get('/verify', (req, res) => {
  const token = req.query.token;
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.sendFile(path.join(__dirname, '../emails/verify-expired.html'));
  }

  // ✅ User verified (DB marking logic optional)
  return res.sendFile(path.join(__dirname, '../emails/verified-success.html'));
});

// === Resend verification ===
router.post('/resend', async (req, res) => {
  const { email } = req.body;
  const token = createVerificationToken(email);
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;

  try {
    await sendEmail(
      email,
      'Verify your SpotAlert account',
      path.join(__dirname, '../emails/verify.html'),
      { verify_url: verifyUrl, first_name: 'User' }
    );
    res.json({ success: true, message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ success: false, message: 'Error sending email.' });
  }
});

export default router;
