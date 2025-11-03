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

    // ✅ Use secure live URL (matches HTTPS frontend)
    const baseUrl = process.env.BASE_URL || 'https://api.spotalert.live';
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

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
    console.warn("⚠️ Invalid or expired verification token");
    return res.sendFile(path.join(__dirname, '../emails/verify-expired.html'));
  }

  // ✅ User verified (DB marking logic optional)
  console.log(`✅ Email verified for: ${decoded.email}`);
  return res.sendFile(path.join(__dirname, '../emails/verified-success.html'));
});

// === Resend verification ===
router.post('/resend', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const token = createVerificationToken(email);
    const baseUrl = process.env.BASE_URL || 'https://api.spotalert.live';
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    await sendEmail(
      email,
      'Verify your SpotAlert account',
      path.join(__dirname, '../emails/verify.html'),
      { verify_url: verifyUrl, first_name: 'User' }
    );

    console.log(`📨 Resent verification to: ${email}`);
    res.json({ success: true, message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ success: false, message: 'Error sending verification email.' });
  }
});

export default router;
